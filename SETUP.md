# BidPower — Guía de conexión

## 1. Supabase

1. Crea un proyecto en https://supabase.com
2. Atajo para un proyecto nuevo: pega `supabase/apply_all_migrations.sql` completo en SQL Editor y ejecútalo una vez.
   O bien, SQL Editor → ejecuta **todas** las migraciones de `supabase/migrations/` en orden de nombre
   (de `20260728000000_initial_schema.sql` a `20260801000010_security_hardening.sql`).
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
