#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create it from .env.example first."
  exit 1
fi

echo "Using env file: $ENV_FILE"
"$ROOT_DIR/scripts/supabase-set-secrets.sh" "$ENV_FILE"
"$ROOT_DIR/scripts/supabase-deploy-functions.sh"

if grep -q '^STRIPE_SECRET_KEY=' "$ENV_FILE"; then
  "$ROOT_DIR/scripts/setup-stripe-webhook.sh" "$ENV_FILE"
fi

cat <<'EOF'

IRIS backend go-live scripts completed.

Next:
1. Verify the Stripe webhook endpoint in your Stripe dashboard.
2. Schedule the maintenance function:
   ./scripts/trigger-maintenance.sh
3. Run end-to-end QA from the site.
EOF
