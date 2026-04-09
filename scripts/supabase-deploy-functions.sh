#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install it first: brew install supabase/tap/supabase"
  exit 1
fi

functions=(
  create-checkout-session
  create-offer-authorization
  respond-to-offer
  create-connect-account
  create-connect-account-link
  stripe-webhook
  release-payout
  mark-order-shipped
  confirm-order-delivery
  run-marketplace-maintenance
)

cd "$ROOT_DIR"

for fn in "${functions[@]}"; do
  echo "Deploying $fn..."
  supabase functions deploy "$fn"
done

echo "All IRIS Edge Functions deployed."
