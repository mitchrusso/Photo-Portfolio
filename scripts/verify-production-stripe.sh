#!/usr/bin/env bash

set -euo pipefail

read -r -s -p "Stripe live secret key (hidden): " stripe_secret_key
printf '\n'

if [[ "$stripe_secret_key" != sk_live_* ]]; then
  echo "A Stripe sk_live_ key is required."
  exit 1
fi

STRIPE_SECRET_KEY="$stripe_secret_key" node scripts/resolve-live-stripe-prices.mjs --verify-webhook >/dev/null
unset stripe_secret_key

echo "Live Stripe production verification passed."
