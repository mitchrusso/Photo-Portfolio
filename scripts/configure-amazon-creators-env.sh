#!/usr/bin/env bash

set -euo pipefail

if [[ ! -d .vercel ]]; then
  echo "This folder is not linked to Vercel. Run 'npx vercel link' first."
  exit 1
fi

read -r -p "Amazon Creators API Credential ID: " credential_id
read -r -s -p "Amazon Creators API Credential Secret (hidden): " credential_secret
printf '\n'
if [[ -n "$credential_secret" ]]; then
  echo "Secret received (${#credential_secret} hidden characters)."
fi
read -r -p "Amazon Creators API Credential Version [3.1 for US]: " credential_version
credential_version="${credential_version:-3.1}"

if [[ -z "$credential_id" || -z "$credential_secret" ]]; then
  echo "Credential ID and Credential Secret are required. Nothing was changed."
  exit 1
fi

add_vercel_variable() {
  local name="$1"
  local value="$2"
  local environment="$3"

  if [[ "$environment" == "production" || "$environment" == "preview" ]]; then
    printf '%s' "$value" | npx vercel env add "$name" "$environment" --force --yes --sensitive --non-interactive
  else
    printf '%s' "$value" | npx vercel env add "$name" "$environment" --force --yes --non-interactive
  fi
}

for environment in production preview development; do
  echo "Adding Amazon Creators API settings to Vercel $environment..."
  add_vercel_variable "AMAZON_CREATORS_CREDENTIAL_ID" "$credential_id" "$environment"
  add_vercel_variable "AMAZON_CREATORS_CREDENTIAL_SECRET" "$credential_secret" "$environment"
  add_vercel_variable "AMAZON_CREATORS_CREDENTIAL_VERSION" "$credential_version" "$environment"
done

unset credential_id credential_secret credential_version

echo "Amazon Creators API credentials were added to Vercel."
echo "A new production deployment will be required before the application can use them."
