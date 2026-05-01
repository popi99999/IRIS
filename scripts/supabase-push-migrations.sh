#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.local}"

if command -v supabase >/dev/null 2>&1; then
  SUPABASE_BIN=(supabase)
else
  NPM_CACHE_DIR="${TMPDIR:-/tmp}/iris-npm-cache"
  mkdir -p "$NPM_CACHE_DIR"
  SUPABASE_BIN=(env npm_config_cache="$NPM_CACHE_DIR" npx --yes supabase@latest)
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Missing required variable: DATABASE_URL"
  exit 1
fi

cd "$ROOT_DIR"
"${SUPABASE_BIN[@]}" db push --db-url "$DATABASE_URL"

echo "Supabase database migrations applied."
