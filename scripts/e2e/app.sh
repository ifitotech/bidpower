#!/usr/bin/env bash
# Rebuilds and (re)starts the app on :3100 against the e2e harness. Run scripts/e2e/up.sh first.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"
export NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY="$(cat "${E2E_WORK:-/tmp/e2e}/anon.key")"
npm run build > "${E2E_WORK:-/tmp/e2e}/build.log" 2>&1 || { tail -30 "${E2E_WORK:-/tmp/e2e}/build.log"; exit 1; }
fuser -k 3100/tcp >/dev/null 2>&1 || true
nohup npx next start -p 3100 > "${E2E_WORK:-/tmp/e2e}/next.log" 2>&1 &
sleep 6; echo "app on 3100"
