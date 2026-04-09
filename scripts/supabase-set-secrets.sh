#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.local}"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install it first: brew install supabase/tap/supabase"
  exit 1
fi

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
  SUPABASE_SERVICE_ROLE_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  STRIPE_CONNECT_CLIENT_ID
  RESEND_API_KEY
  EMAIL_FROM
  PUBLIC_SITE_URL
  CRON_SECRET
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required variable: $var_name"
    exit 1
  fi
done

cd "$ROOT_DIR"
supabase secrets set \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  STRIPE_CONNECT_CLIENT_ID="$STRIPE_CONNECT_CLIENT_ID" \
  RESEND_API_KEY="$RESEND_API_KEY" \
  EMAIL_FROM="$EMAIL_FROM" \
  PUBLIC_SITE_URL="$PUBLIC_SITE_URL" \
  CRON_SECRET="$CRON_SECRET"

echo "Supabase Edge Function secrets updated."
