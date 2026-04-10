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

functions_without_gateway_jwt=(
  create-checkout-session
  create-offer-authorization
  respond-to-offer
  release-payout
  create-connect-account
  create-connect-account-link
  mark-order-shipped
  confirm-order-delivery
)

cd "$ROOT_DIR"

for fn in "${functions[@]}"; do
  echo "Deploying $fn..."
  deploy_args=(functions deploy "$fn" --project-ref "$PROJECT_REF")
  if printf '%s\n' "${functions_without_gateway_jwt[@]}" | grep -qx "$fn"; then
    deploy_args+=(--no-verify-jwt)
  fi
  $SUPABASE_BIN "${deploy_args[@]}"
done

echo "All IRIS Edge Functions deployed."
