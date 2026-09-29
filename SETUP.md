# Project Harbor — Guía de conexión

## 1. Supabase

1. Crea un proyecto en https://supabase.com
2. SQL Editor → ejecuta **todas** las migraciones de `supabase/migrations/` en orden de nombre
   (de `20260728000000_initial_schema.sql` a `20260730000007_phase1_company_bootstrap.sql`).
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
EOF
cd /home/workdir/artifacts && rm -f ContractorOS-Base.zip && zip -r ContractorOS-Base.zip contractoros -x "contractoros/node_modules/*" && ls -lh ContractorOS-Base.zip && find contractoros -type f | wc -l && find contractoros/src/app -name "page.tsx" | wc -l
