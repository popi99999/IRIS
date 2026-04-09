#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.local}"
PROJECT_REF="${SUPABASE_PROJECT_REF:-$(sed -n 's/^project_id = \"\\(.*\\)\"/\\1/p' "$ROOT_DIR/supabase/config.toml" | head -n1)}"

if command -v supabase >/dev/null 2>&1; then
  SUPABASE_BIN="supabase"
else
  SUPABASE_BIN="npx --yes supabase@latest"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

if [[ -z "$PROJECT_REF" ]]; then
  echo "Missing project ref. Set SUPABASE_PROJECT_REF or supabase/config.toml project_id."
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
$SUPABASE_BIN secrets set --project-ref "$PROJECT_REF" \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  STRIPE_CONNECT_CLIENT_ID="${STRIPE_CONNECT_CLIENT_ID:-}" \
  STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY:-}" \
  RESEND_API_KEY="$RESEND_API_KEY" \
  EMAIL_FROM="$EMAIL_FROM" \
  SUPPORT_EMAIL="${SUPPORT_EMAIL:-support@iris-fashion.it}" \
  OWNER_EMAIL="${OWNER_EMAIL:-owner@iris-fashion.it}" \
  ADMIN_EMAILS="${ADMIN_EMAILS:-admin@iris-fashion.it}" \
  PUBLIC_SITE_URL="$PUBLIC_SITE_URL" \
  CRON_SECRET="$CRON_SECRET" \
  S3_BUCKET="${S3_BUCKET:-}" \
  S3_REGION="${S3_REGION:-eu-south-1}" \
  S3_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID:-}" \
  S3_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY:-}" \
  SHIPPO_API_KEY="${SHIPPO_API_KEY:-}" \
  SENTRY_DSN="${SENTRY_DSN:-}" \
  POSTHOG_API_KEY="${POSTHOG_API_KEY:-}" \
  PAYOUT_HOLD_DAYS="${PAYOUT_HOLD_DAYS:-7}" \
  UNSHIPPED_REMINDER_DAYS="${UNSHIPPED_REMINDER_DAYS:-3}"

echo "Supabase Edge Function secrets updated."
