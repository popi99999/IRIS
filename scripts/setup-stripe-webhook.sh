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
  SUPABASE_URL
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required variable: $var_name"
    exit 1
  fi
done

WEBHOOK_URL="${SUPABASE_URL%/}/functions/v1/stripe-webhook"

response="$(
  curl -sS https://api.stripe.com/v1/webhook_endpoints \
    -u "$STRIPE_SECRET_KEY:" \
    -d "url=$WEBHOOK_URL" \
    -d "enabled_events[]=checkout.session.completed" \
    -d "enabled_events[]=checkout.session.expired" \
    -d "enabled_events[]=checkout.session.async_payment_failed" \
    -d "enabled_events[]=payment_intent.succeeded" \
    -d "enabled_events[]=payment_intent.captured" \
    -d "enabled_events[]=payment_intent.payment_failed" \
    -d "enabled_events[]=payment_intent.canceled" \
    -d "enabled_events[]=charge.refunded" \
    -d "enabled_events[]=charge.dispute.created" \
    -d "enabled_events[]=charge.dispute.closed" \
    -d "enabled_events[]=transfer.created" \
    -d "enabled_events[]=account.updated"
)"

echo "$response"
echo
echo "Save the returned signing secret as STRIPE_WEBHOOK_SECRET and run supabase-set-secrets.sh again."
