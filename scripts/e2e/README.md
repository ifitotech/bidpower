# Local end-to-end harness (no Supabase cloud needed)

Runs the real app against a real Postgres with the real migrations, served by the real **PostgREST**
(same query engine and RLS behavior as Supabase). Only GoTrue (auth) and Storage are replaced by a small
shim (`shim.js`) that signs real JWTs, so RLS runs exactly as in production.

Requirements: PostgreSQL 16, the `postgrest` binary (`docker create postgrest/postgrest` + `docker cp`, or a release
download), `npm i pg jsonwebtoken` in `/opt/e2e-node` (or set `E2E_NODE_PATH`), Playwright + Chromium.

```
bash scripts/e2e/up.sh          # DB + migrations + PostgREST + shim
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=anon npm run build && npx next start -p 3100 &
BASE_URL=http://localhost:3100 node scripts/e2e/flows.js
```

This is a test tool only (never used by the app). It does not replace a run against the real Supabase project.
