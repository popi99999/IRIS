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
  STRIPE_SECRET_KEY
  PUBLIC_SITE_URL
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required variable: $var_name"
    exit 1
  fi
done

WEBHOOK_URL="${PUBLIC_SITE_URL%/}/functions/v1/stripe-webhook"

response="$(
  curl -sS https://api.stripe.com/v1/webhook_endpoints \
    -u "$STRIPE_SECRET_KEY:" \
    -d "url=$WEBHOOK_URL" \
    -d "enabled_events[]=checkout.session.completed" \
    -d "enabled_events[]=checkout.session.expired" \
    -d "enabled_events[]=payment_intent.captured" \
    -d "enabled_events[]=payment_intent.payment_failed" \
    -d "enabled_events[]=payment_intent.canceled"
)"

echo "$response"
echo
echo "Save the returned signing secret as STRIPE_WEBHOOK_SECRET and run supabase-set-secrets.sh again."
