#!/usr/bin/env bash
# Brings up: Postgres (db "e2e") with all migrations, PostgREST on 54331, auth/storage shim on 54321.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGREST_BIN="${PGREST_BIN:-/opt/pgrst/postgrest}"
WORK="${E2E_WORK:-/tmp/e2e}"; mkdir -p "$WORK"; chmod a+rwx "$WORK"
cp "$ROOT"/scripts/e2e/stubs.sql "$ROOT"/supabase/migrations/*.sql "$WORK"/ && chmod a+r "$WORK"/*
pg_lsclusters | grep -q online || { pg_ctlcluster 16 main start; sleep 3; }
su postgres -c "psql -qc 'drop database if exists e2e' -c 'create database e2e'" 
su postgres -c "psql -q -d e2e -v ON_ERROR_STOP=1 -f $WORK/stubs.sql" >/dev/null
for f in "$WORK"/2026*.sql; do su postgres -c "psql -q -d e2e -v ON_ERROR_STOP=1 -f $f" >/dev/null 2>"$WORK/mig.err" || { echo "migration failed: $f"; cat "$WORK/mig.err"; exit 1; }; done
su postgres -c "psql -q -d e2e -c \"alter database e2e set search_path to public\"" >/dev/null
fuser -k 54331/tcp 54321/tcp >/dev/null 2>&1 || true
cat > "$WORK/postgrest.conf" <<CONF
db-uri = "postgres://authenticator:auth-pass@127.0.0.1:5432/e2e"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "e2e-secret-e2e-secret-e2e-secret-123456"
server-port = 54331
db-pool = 10
CONF
nohup "$PGREST_BIN" "$WORK/postgrest.conf" > "$WORK/postgrest.log" 2>&1 &
nohup node "$ROOT/scripts/e2e/shim.js" > "$WORK/shim.log" 2>&1 &
sleep 3
curl -sf http://127.0.0.1:54331/ >/dev/null && echo "PostgREST up" || { echo "PostgREST failed"; cat "$WORK/postgrest.log"; exit 1; }
ANON=$(NODE_PATH="${E2E_NODE_PATH:-/opt/e2e-node/node_modules}" node -e 'console.log(require("jsonwebtoken").sign({role:"anon",iss:"e2e"},"e2e-secret-e2e-secret-e2e-secret-123456"))')
echo "$ANON" > "$WORK/anon.key"
echo "ready — use NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=\$(cat $WORK/anon.key)"
