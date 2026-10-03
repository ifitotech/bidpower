# BidPower — Contexto para continuar el trabajo (Codex u otro agente)

Léelo junto con `AGENTS.md`, `README.md`, `PROJECT_CONTEXT.md`, `PRODUCT_DIRECTION.md` (fuente de verdad del producto) y `SETUP.md` (secciones 16–40: todo lo construido, por fase, con notas técnicas). El usuario habla **español**: responde en español; el código y los commits van en inglés.

## 1. Qué es
**BidPower**: app para contratistas eléctricos (primero) y sus equipos y suppliers. Todo gira alrededor del **proyecto**. Flujo central:
Cliente → Proyecto → **Lista de material** → "Comprar ya" (Orden de compra) **o** "Pedir cotización a suppliers" (comparar y adjudicar → PO) → recibo obligatorio → costo real al proyecto → **Propuesta** al cliente (enlace seguro, aprueba o pide cambios) → Factura → pagos registrados a mano.
- **No** es contabilidad, **no** cobra ni procesa pagos, **no** envía correos por el usuario (se comparte el enlace por WhatsApp/correo), **no** analiza planos con IA (los takeoffs son conteos manuales marcados PRELIMINAR).
- Vocabulario separado (no mezclar): Material Request (empleado→oficina), Pricing Request/Cotización (contratista→supply), Proposal (contratista→cliente), Purchase Order, Change Request/Change Order (cliente).
- Roles: owner / manager / employee (permisos individuales por persona, ver `src/lib/permissions.ts`), cuentas **supply** (`companies.kind='supply'`), clientes y suppliers externos por enlaces con token (sin cuenta).

## 2. Stack y ejecución
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · Supabase (Auth, Postgres, Storage, **RLS**) · Server Actions · PWA (`public/sw.js` solo cachea `/offline.html`) · i18n propio ES/EN/PT (`src/lib/i18n/dictionaries/*.ts`; los tres idiomas siempre completos y sin mezclar; textos largos de ayuda/legales en `src/lib/site-content/`).
- Comandos: `npm run typecheck`, `npm run build` (obligatorios tras cambios importantes). No hay ESLint configurado (`npm run lint` pide configurarlo).
- Producción: `https://bidpower-beta.vercel.app` (proyecto Vercel `bidpower`). Cada push a la rama crea un preview; el usuario revisa ahí y hace Merge del PR él mismo. Supabase real: proyecto `fgivzbnzdqjewcxpapnd` (los previews usan la misma base real).
- Ramas: trabajo en `claude/relaxed-feynman-92wttq`. Hay una rama local `wip/catalog-server` ya fusionada.

## 3. Mapa del código
- `src/app/(auth)` login/registro/recuperar · `src/app/(dashboard)/*` app autenticada (projects, clients, material, materials, pricing, pos, quotes=propuestas, invoices, expenses, employees, suppliers, reports, accounting, calendar, search, settings, feedback, more, admin/catalog) · `src/app/supply` espacio de cuentas supply · `src/app/customer|supplier|invite/[token]` páginas públicas por enlace · `src/app/(site)` páginas públicas reales: `/terms`, `/privacy`, `/help`.
- `src/lib/services/*` acceso a datos (server); `actions.ts` junto a cada página = Server Actions (validan rol/permiso, devuelven `errorCode` que el cliente traduce con `t()`).
- `src/lib/materials.ts` búsqueda tolerante (sinónimos, fracciones, `thhn8blk`), `searchPatterns` (mismas reglas como regex Postgres), `src/lib/catalog/*` catálogo estándar, `src/lib/material-import.ts` importador Excel/CSV.
- `supabase/migrations/*.sql` (33 migraciones) y `supabase/apply_all_migrations.sql` (bundle: agregar cada migración nueva al final).

## 4. Reglas del usuario (importantes)
- Multi-tenant por `company_id`; **RLS nunca se desactiva**; cambios de BD **solo por migración**; funciones `SECURITY DEFINER` con `search_path` fijo y `REVOKE` a anon.
- Nada fabricado: ni análisis de IA, ni pagos, ni firmas, ni métricas, ni datos de catálogo inventados (precios/marcas/partes).
- Mobile-first: safe areas de iPhone, layouts de iPad; ya se cuidó el desborde horizontal.
- Preguntar antes de: cambios a datos reales o al modelo de datos, costos nuevos (proveedor de correo, monitoreo), cambios en cómo trabaja su equipo. Secretos nunca en el chat. Sin atajos de login en la app. Routehub (otro proyecto: Supabase `ddsenvgujgjaslsawriu`, Vercel `routehub-wisu`) no se toca.
- Commits terminan con las líneas de atribución que pida el entorno; no mencionar modelos en archivos del repo.

## 5. Decisiones de diseño recientes (no revertir sin hablar)
- **Material = carrito**: constructor de lista (`projects/[id]/materials/new/RequestBuilder.tsx`) con `+` de un toque, stepper, Enter agrega el primero, listas guardadas, "repetir pedido anterior", guardar lista al momento, importar Excel/CSV con cantidades.
- **Buscar, no desplazar**: la biblioteca de la empresa y el constructor **solo muestran productos al escribir** (el usuario lo pidió explícitamente). Botones Seleccionar y "Vaciar biblioteca" (archiva todo y borra listas guardadas).
- **Catálogo estándar** (6585 ítems, `data/bidpower_materials.csv` = archivo de 6500 del usuario + 85 breakers de marca de la versión anterior; el original está en `data/bidpower_materials_6500.csv`): tabla global `catalog_materials` en el servidor (migración 33), búsqueda en servidor con `catalog_search`, **no se copia a cada empresa**; al usarse en un pedido un owner/manager lo trae a su biblioteca (reusa por nombre). Carga/actualización: `/admin/catalog` (solo `platform_admins`; hoy `owner@prueba.test`). **El catálogo en el servidor aún está vacío hasta que el usuario cargue el CSV desde esa pantalla.**
- Aprobación del cliente guarda nombre + fecha + hora + IP; **no** es firma certificada (así se dice en términos y ayuda).
- Números de documento atómicos (`number_counters`/`bump_number`), pagos atómicos (`record_invoice_payment`), "hoy" en zona horaria de la empresa, estado "vencida" de factura calculado.
- Diálogos de confirmación propios (`src/lib/confirm.ts` + `ConfirmHost`), no `window.confirm`.
- Lista generada en código (~1050 ítems) quedó **oculta** y sin uso en `src/lib/catalog/generated-starter.ts` (el usuario pidió conservarla para decidir cómo aprovecharla).

## 6. Pruebas (hazlas antes de entregar)
Arnés real local (Postgres + PostgREST + shim de Auth + app en :3100), ver `scripts/e2e/README.md`:
```
bash scripts/e2e/up.sh      # Postgres con TODAS las migraciones + PostgREST + shim
bash scripts/e2e/app.sh     # build y arranque de la app en :3100
node scripts/e2e/flows.js all   # ~12 min, ~199 comprobaciones (incluye rastreo de 79 páginas, accesibilidad, públicas, supply, catálogo, ayuda)
node scripts/e2e/rls.js         # ataques entre empresas/roles/anon y funciones
node scripts/e2e/concurrency.js # números y pagos simultáneos
```
Trucos: lanzar con `setsid nohup ... &` (los procesos hijos mueren si el shell termina); **no reconstruir mientras corre el e2e**; el contenedor a veces apaga Postgres (volver a correr `up.sh`). `npx tsc --noEmit` es seguro en cualquier momento. Estado al cierre: todo en verde (199 PASS, RLS y concurrencia OK).

## 7. Trampas conocidas
- **No agregar `loading.tsx` en `(dashboard)`**: en Next 15.5 deja la pantalla con datos viejos tras `router.refresh()` (hay `NavProgress` como barra de carga).
- Supabase MCP: `apply_migration` y sentencias destructivas pueden colgarse esperando confirmación humana; usar `execute_sql` con sentencias pequeñas, `ALTER POLICY` en vez de `DROP POLICY`, y registrar a mano en `supabase_migrations.schema_migrations`.
- Funciones que usan `pg_trgm` en Supabase necesitan `search_path = public, extensions`.
- Archivos subidos: PDF/JPG/PNG/WebP ≤10 MB (logo ≤5 MB); HEIC del iPhone se acepta por tipo explícito en los inputs.
- i18n: al agregar claves, agregarlas en `es`, `en` y `pt`.

## 8. Pendiente / siguiente
1. **Usuario**: entrar con `owner@prueba.test` → Configuración → Catálogo estándar (administrador) → cargar `data/bidpower_materials.csv`. Revisar el preview de Vercel.
2. **Supabase real**: migración **32** (rendimiento) a medias: aplicadas 10 de 28 `ALTER POLICY`, faltan 18 políticas, 99 índices y registrar 31/32 en `schema_migrations` (el SQL está en `supabase/migrations/20260822000032_*.sql` y en el bundle). Migración 31 (límites del bucket) aplicada pero sin registrar.
3. Calidad del CSV de 6500: la parte nueva (≈3944 ítems de Distribution/Controls) es combinatoria con combinaciones poco realistas (kAIC iguales en todas las tensiones, electrónicos de 15–90 A, accesorios repetidos por panel); sugerir depurar. Faltan categorías: transformadores, ventiladores, focos, detectores de humo, timbres, EV, generadores, relés, herramientas, cemento/primer PVC, calafateo, NM-B 8/2 y 6/2.
4. Revisión legal de `/terms` y `/privacy` por un abogado; variables en Vercel `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_LEGAL_ADDRESS`, `NEXT_PUBLIC_SUPPORT_EMAIL`.
5. Necesitan decisión del usuario: proveedor de correo real (p. ej. Resend), precios/Stripe, mover columnas de dinero del proyecto (contract_value, budget_*) a una tabla protegida (hoy un empleado asignado puede leerlas por API), configuración de Auth (URLs, "Confirm email", protección de contraseñas filtradas), cambiar la contraseña de prueba y la `service_role`.
6. Ideas aprobadas en el aire: propuesta desde lista de material (precio = último costo + margen indicado por el usuario), "respuesta recibida" como avisos, catálogos de suppliers conectados con precios.
