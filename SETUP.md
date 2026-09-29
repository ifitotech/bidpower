# BidPower — Guía de conexión

## 1. Supabase

1. Crea un proyecto en https://supabase.com
2. Atajo para un proyecto nuevo: pega `supabase/apply_all_migrations.sql` completo en SQL Editor y ejecútalo una vez.
   O bien, SQL Editor → ejecuta **todas** las migraciones de `supabase/migrations/` en orden de nombre
   (de `20260728000000_initial_schema.sql` a `20260804000014_phase4_supplier_link.sql`).
   La última crea la función `create_company_with_owner`, necesaria para que el registro
   cree empresa, owner, settings, plan Free y categorías de forma segura con RLS activo.
3. Storage → New bucket:
   - Nombre: `documents`
   - Public: **No**
4. Authentication → Providers → Email habilitado

## 2. Variables de entorno

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 3. Arrancar

```bash
npm install
npm run dev
```

Abre http://localhost:3000/register y crea la primera empresa.

## 4. Qué queda por cablear en UI (ya hay servicios)

| Formulario | Server Action / Service |
|------------|-------------------------|
| Register / Login | `(auth)/actions.ts` ✅ |
| Nuevo Cliente | `createClientAction` ✅ |
| Nuevo Proyecto | `createProjectAction` ✅ |
| Nuevo Gasto | `createExpenseAction` ✅ |
| Nuevo PO | `createPOAction` ✅ |
| Nuevo Quote | `createQuote` service (falta action wrapper) |
| Subir documento PO | `uploadDocument` service |
| Invitar empleado | `inviteEmployee` service |

## 5. Checklist post-conexión

- [ ] Registro crea empresa + categorías + plan Free
- [ ] Login redirige a dashboard
- [ ] Dashboard muestra métricas reales
- [ ] Crear cliente / proyecto / gasto / PO
- [ ] PO no completa sin documento
- [ ] Límites Free bloquean creación
- [ ] PDF de quote en `/api/quotes/[id]/pdf`
- [ ] Bucket documents acepta uploads

## 6. Deploy (Vercel)

1. Push a GitHub
2. Import en Vercel
3. Añadir env vars
4. Deploy

## 7. Equipo y permisos (Fase 2)

- Invitar: Owner → Empleados → Invitar. Se genera un enlace seguro de un solo uso (vence en 7 días, se muestra una vez).
  Compártelo (p. ej. por WhatsApp); la persona crea su cuenta o inicia sesión con **ese mismo email** y acepta.
  No se envía email desde la app (no hay proveedor de correo configurado).
- Los empleados solo ven proyectos asignados; sin "ver costos" no reciben montos; sin "ver ganancia" no reciben ganancia.
- Límite de PO: por encima del límite el PO no se puede crear (el Owner lo crea). El flujo de aprobación llega en Compras (Fase 5).
- Una persona con cuenta en dos empresas ve la primera a la que se unió (no hay selector de empresa todavía).

## 8. Prueba de humo (Fases 1 y 2)

`scripts/smoke-phase1-2.js` recorre en un navegador real: registro, empresa, proyecto, refresco, logout/login,
aislamiento entre empresas, invitación, permisos, asignación y desactivación (21 comprobaciones).

```bash
BASE_URL=https://TU-APP.vercel.app node scripts/smoke-phase1-2.js
```

Requiere Playwright + Chromium y "Confirm email" desactivado en Supabase Auth. Crea usuarios `@bidpower-smoke.test`;
las instrucciones para borrarlos están en la cabecera del script.

## 9. Materiales (Fase 3)

- **Biblioteca** (`/materials`): ítems de uso frecuente con unidad, categoría, apodos de campo (romex, mud ring…) y favoritos. La gestiona quien tenga el permiso *Gestionar biblioteca* (Owner y Manager por plantilla).
- **Pedido de material** (`Proyecto → Pedidos de material`): buscar en favoritos/recientes/apodos, agregar texto libre, pegar una lista (WhatsApp/correo/Excel) o usar una lista guardada. Requiere el permiso *Pedir material* y un proyecto visible para la persona.
- Owner/Manager revisan en `/materials/requests` (también aparece en Inicio → "Necesita atención"). Un pedido es distinto de una Solicitud a proveedores: no envía nada a nadie ni genera precios.
- Migración nueva: `20260802000011_phase3_materials.sql` (ya incluida en `apply_all_migrations.sql`).

## 10. Supplier Pricing (Fase 4, primera parte)

- **Pricing Request** (`/pricing`): se crea desde un pedido de material revisado (las líneas se copian, no se reescriben) o pegando líneas. Tipo Gear/Lighting/Material/Otro, Bid Date, notas/specs, links y archivos (PDF/imagen, máx. 10 MB). Requiere el permiso *Crear Pricing Request*.
- **Envío**: no se envían correos (no hay proveedor de correo). Crea un enlace seguro por supplier y compártelo tú (WhatsApp/correo), o copia el texto y márcalo "enviado".
- **Respuesta del supplier**: Owner/Manager registran precio, disponibilidad y lead time por línea, número y total del quote, y el PDF. La comparación resalta el mejor precio por línea. "Adjudicar" marca la respuesta ganadora; el PO llega en la Fase 5.
- **Precios privados**: solo Owner/Manager, o quien tenga *Crear Pricing Request* **y** *Ver costos*, ve respuestas y PDFs de precios.
- Migraciones nuevas: `20260803000012_phase4_supplier_pricing.sql` y `20260803000013_pricing_attachment_visibility.sql`.

### Enlace seguro para el supplier (sin cuenta)

- En el Pricing Request → *Enlaces para suppliers* → *Crear enlace seguro*. Se muestra **una sola vez** (solo se guarda su hash), vence en 14 días por defecto y se puede revocar.
- El supplier abre `/supplier/<token>`: ve las líneas, Bid Date, notas y links; responde con precio/disponibilidad/lead time por línea, quote number, total, flete e impuesto (puede corregir mientras esté abierto); y puede hacer preguntas. **No** ve proyecto, cliente, otros suppliers ni lo que cobras.
- Una pregunta pone el Pricing Request en *Pregunta abierta* (espera al Owner); al responderla vuelve a esperar al supplier. Una respuesta lo pasa a *Respondió*.
- Límites de esta versión: el supplier no sube el PDF él mismo (súbelo tú en su respuesta) ni ve archivos subidos, solo links; no hay límite de intentos por IP (el token tiene 256 bits); no hay avisos por correo.
- Migración: `20260804000014_phase4_supplier_link.sql`.
