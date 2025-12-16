#!/bin/sh
set -e

echo "Substituting environment variables..."

# Substitute NEXT_PUBLIC_* placeholders in JS bundles
# These were baked in at build time as __PLACEHOLDER__ values
find /app/apps/frontend/.next -type f \( -name "*.js" -o -name "*.json" \) -print0 | xargs -0 sed -i \
  -e "s|__NEXT_PUBLIC_APP_ENV__|${NEXT_PUBLIC_APP_ENV:-}|g" \
  -e "s|__NEXT_PUBLIC_PRIVY_APP_ID__|${NEXT_PUBLIC_PRIVY_APP_ID:-}|g" \
  -e "s|__NEXT_PUBLIC_PRIVY_CLIENT_ID__|${NEXT_PUBLIC_PRIVY_CLIENT_ID:-}|g" \
  -e "s|__NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID__|${NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:-}|g" \
  -e "s|__NEXT_PUBLIC_TRANSAK_API_KEY__|${NEXT_PUBLIC_TRANSAK_API_KEY:-}|g" \
  -e "s|__NEXT_PUBLIC_DATADOG_ENV__|${NEXT_PUBLIC_DATADOG_ENV:-}|g" \
  -e "s|__NEXT_PUBLIC_DATADOG_APP_TOKEN__|${NEXT_PUBLIC_DATADOG_APP_TOKEN:-}|g" \
  -e "s|__NEXT_PUBLIC_DATADOG_CLIENT_TOKEN__|${NEXT_PUBLIC_DATADOG_CLIENT_TOKEN:-}|g" \
  -e "s|__NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN__|${NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN:-}|g" \
  -e "s|__NEXT_PUBLIC_DELEGATOR_URL__|${NEXT_PUBLIC_DELEGATOR_URL:-}|g" \
  -e "s|__NEXT_PUBLIC_IPFS_PINNING_SERVICE__|${NEXT_PUBLIC_IPFS_PINNING_SERVICE:-}|g" \
  -e "s|__NEXT_PUBLIC_NFT_STORAGE_KEY__|${NEXT_PUBLIC_NFT_STORAGE_KEY:-}|g" \
  -e "s|__NEXT_PUBLIC_APP_VERSION__|${NEXT_PUBLIC_APP_VERSION:-}|g"

echo "Environment variables substituted successfully"

exec "$@"
