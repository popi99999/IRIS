#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_REF="${SUPABASE_PROJECT_REF:-$(sed -n 's/^project_id = \"\\(.*\\)\"/\\1/p' "$ROOT_DIR/supabase/config.toml" | head -n1)}"

if command -v supabase >/dev/null 2>&1; then
  SUPABASE_BIN="supabase"
else
  SUPABASE_BIN="npx --yes supabase@latest"
fi

if [[ -z "$PROJECT_REF" ]]; then
  echo "Missing project ref. Set SUPABASE_PROJECT_REF or supabase/config.toml project_id."
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
  $SUPABASE_BIN functions deploy "$fn" --project-ref "$PROJECT_REF"
done

echo "All IRIS Edge Functions deployed."
