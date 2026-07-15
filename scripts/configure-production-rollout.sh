#!/usr/bin/env bash

set -euo pipefail

if [[ ! -d .vercel ]]; then
  echo "This folder is not linked to Vercel. Run 'npx vercel link' first."
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "OpenSSL is required to generate secure application secrets."
  exit 1
fi

prompt_secret() {
  local prompt="$1"
  local variable_name="$2"
  local value

  read -r -s -p "$prompt" value
  printf '\n'
  printf -v "$variable_name" '%s' "$value"
}

require_prefix() {
  local label="$1"
  local value="$2"
  local prefix="$3"

  if [[ "$value" != "$prefix"* ]]; then
    echo "$label must begin with '$prefix'. Nothing was changed."
    exit 1
  fi
}

read -r -p "Resend sender [PhotoView.io <hello@mitchrusso.com>]: " email_from
email_from="${email_from:-PhotoView.io <hello@mitchrusso.com>}"
if [[ "$email_from" != *"@"* || "$email_from" == re_* ]]; then
  echo "The Resend sender must be an email address, not an API key. Nothing was changed."
  exit 1
fi
prompt_secret "Resend API key (hidden): " resend_api_key
require_prefix "Resend API key" "$resend_api_key" "re_"
prompt_secret "Stripe live secret key (hidden): " stripe_secret_key
require_prefix "Stripe secret key" "$stripe_secret_key" "sk_live_"
read -r -p "Stripe live publishable key: " stripe_publishable_key
require_prefix "Stripe publishable key" "$stripe_publishable_key" "pk_live_"
prompt_secret "Stripe production webhook signing secret (hidden): " stripe_webhook_secret
require_prefix "Stripe webhook signing secret" "$stripe_webhook_secret" "whsec_"

echo
echo "Finding and validating the existing LIVE PhotoView.io prices in Stripe..."
price_file="$(mktemp /tmp/photoviewpro-live-prices.XXXXXX)"
cleanup_price_file() {
  rm -f "$price_file"
}
trap cleanup_price_file EXIT

if ! STRIPE_SECRET_KEY="$stripe_secret_key" node scripts/resolve-live-stripe-prices.mjs --verify-webhook >"$price_file"; then
  echo "No Vercel settings were changed."
  exit 1
fi

while IFS='=' read -r price_name price_value; do
  case "$price_name" in
    STRIPE_PRICE_STARTER_MONTHLY) stripe_price_starter_monthly="$price_value" ;;
    STRIPE_PRICE_STARTER_YEARLY) stripe_price_starter_yearly="$price_value" ;;
    STRIPE_PRICE_GROWTH_MONTHLY) stripe_price_growth_monthly="$price_value" ;;
    STRIPE_PRICE_GROWTH_YEARLY) stripe_price_growth_yearly="$price_value" ;;
    STRIPE_PRICE_STUDIO_MONTHLY) stripe_price_studio_monthly="$price_value" ;;
    STRIPE_PRICE_STUDIO_YEARLY) stripe_price_studio_yearly="$price_value" ;;
    STRIPE_PRICE_PREMIER_MONTHLY) stripe_price_premier_monthly="$price_value" ;;
    STRIPE_PRICE_PREMIER_YEARLY) stripe_price_premier_yearly="$price_value" ;;
  esac
done <"$price_file"

cleanup_price_file
trap - EXIT

price_ids=(
  "$stripe_price_starter_monthly"
  "$stripe_price_starter_yearly"
  "$stripe_price_growth_monthly"
  "$stripe_price_growth_yearly"
  "$stripe_price_studio_monthly"
  "$stripe_price_studio_yearly"
  "$stripe_price_premier_monthly"
  "$stripe_price_premier_yearly"
)

for price_id in "${price_ids[@]}"; do
  require_prefix "Every Stripe price ID" "$price_id" "price_"
done

if [[ "$(printf '%s\n' "${price_ids[@]}" | sort -u | wc -l | tr -d ' ')" != "8" ]]; then
  echo "Every plan and billing cycle must use a distinct Stripe price ID. Nothing was changed."
  exit 1
fi

echo "Verified all eight live recurring prices."

auth_secret="$(openssl rand -base64 48 | tr -d '\n')"
cron_secret="$(openssl rand -base64 48 | tr -d '\n')"

echo
echo "This will configure Vercel PRODUCTION for PhotoView.io with:"
echo "  - a newly generated Auth.js secret"
echo "  - Resend transactional email from $email_from"
echo "  - Stripe LIVE billing and all eight plan prices"
echo "  - https://photoview.io as the production application URL"
echo
echo "The Stripe webhook endpoint must be https://photoview.io/api/stripe/webhook"
echo "and subscribe to: checkout.session.completed, customer.subscription.created,"
echo "customer.subscription.updated, customer.subscription.deleted,"
echo "invoice.payment_succeeded, and invoice.payment_failed."
echo
read -r -p "Type APPLY to write these Production variables to Vercel: " confirmation

if [[ "$confirmation" != "APPLY" ]]; then
  echo "Canceled. Nothing was changed."
  exit 0
fi

add_production_variable() {
  local name="$1"
  local value="$2"
  local sensitivity="$3"

  if [[ "$sensitivity" == "sensitive" ]]; then
    printf '%s' "$value" | npx vercel env add "$name" production --force --yes --sensitive --non-interactive
  else
    printf '%s' "$value" | npx vercel env add "$name" production --force --yes --non-interactive
  fi
}

echo "Adding secure application and email settings..."
add_production_variable "AUTH_SECRET" "$auth_secret" sensitive
add_production_variable "AUTH_URL" "https://photoview.io" plain
add_production_variable "NEXTAUTH_URL" "https://photoview.io" plain
add_production_variable "NEXT_PUBLIC_APP_URL" "https://photoview.io" plain
add_production_variable "RESEND_API_KEY" "$resend_api_key" sensitive
add_production_variable "EMAIL_FROM" "$email_from" plain
add_production_variable "CRON_SECRET" "$cron_secret" sensitive
add_production_variable "EMAIL_AUTOMATION_SECRET" "$cron_secret" sensitive

echo "Adding Stripe LIVE settings..."
add_production_variable "STRIPE_SECRET_KEY" "$stripe_secret_key" sensitive
add_production_variable "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$stripe_publishable_key" plain
add_production_variable "STRIPE_WEBHOOK_SECRET" "$stripe_webhook_secret" sensitive
add_production_variable "STRIPE_EXPECTED_MODE" "live" plain
add_production_variable "STRIPE_AUTOMATIC_TAX_ENABLED" "false" plain
add_production_variable "STRIPE_PRICE_STARTER_MONTHLY" "$stripe_price_starter_monthly" plain
add_production_variable "STRIPE_PRICE_STARTER_YEARLY" "$stripe_price_starter_yearly" plain
add_production_variable "STRIPE_PRICE_GROWTH_MONTHLY" "$stripe_price_growth_monthly" plain
add_production_variable "STRIPE_PRICE_GROWTH_YEARLY" "$stripe_price_growth_yearly" plain
add_production_variable "STRIPE_PRICE_STUDIO_MONTHLY" "$stripe_price_studio_monthly" plain
add_production_variable "STRIPE_PRICE_STUDIO_YEARLY" "$stripe_price_studio_yearly" plain
add_production_variable "STRIPE_PRICE_PREMIER_MONTHLY" "$stripe_price_premier_monthly" plain
add_production_variable "STRIPE_PRICE_PREMIER_YEARLY" "$stripe_price_premier_yearly" plain

unset auth_secret confirmation cron_secret email_from resend_api_key
unset stripe_publishable_key stripe_secret_key stripe_webhook_secret
unset stripe_price_starter_monthly stripe_price_starter_yearly
unset stripe_price_growth_monthly stripe_price_growth_yearly
unset stripe_price_studio_monthly stripe_price_studio_yearly
unset stripe_price_premier_monthly stripe_price_premier_yearly price_ids price_id

echo
echo "Production rollout variables were added to Vercel."
echo "Next, verify the saved live account, prices, and webhook before deploying:"
echo "  npm run stripe:verify:production"
