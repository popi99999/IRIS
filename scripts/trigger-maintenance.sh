#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

required_vars=(
  SUPABASE_URL
  SUPABASE_ANON_KEY
  CRON_SECRET
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required variable: $var_name"
    exit 1
  fi
done

curl -sS -X POST "${SUPABASE_URL%/}/functions/v1/run-marketplace-maintenance" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
echo
