#!/bin/bash
# Test Docker multi-env build locally

set -e

echo "=== Building Docker image with standalone output ==="
echo "Using npm @vechain/vebetterdao-contracts package (skips Solidity build)"
docker build --build-arg USE_NPM_CONTRACTS=true -t b3tr-frontend:test .

echo ""
echo "=== Testing with staging env vars ==="
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_APP_ENV=testnet-staging \
  -e NEXT_PUBLIC_PRIVY_APP_ID=your-test-privy-id \
  -e NEXT_PUBLIC_PRIVY_CLIENT_ID=your-test-client-id \
  -e NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=test-wc-id \
  -e NEXT_PUBLIC_TRANSAK_API_KEY=test-transak \
  -e NEXT_PUBLIC_DATADOG_ENV=staging \
  -e NEXT_PUBLIC_DATADOG_APP_TOKEN=test \
  -e NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=test \
  -e NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN=test \
  -e NEXT_PUBLIC_DELEGATOR_URL=https://sponsor-testnet.vechain.energy/by/269 \
  -e NEXT_PUBLIC_IPFS_PINNING_SERVICE=https://api.pinata.cloud/psa \
  -e NEXT_PUBLIC_NFT_STORAGE_KEY=test \
  -e NEXT_PUBLIC_APP_VERSION=test-local \
  b3tr-frontend:test

# To test mainnet config instead, change NEXT_PUBLIC_APP_ENV to "mainnet"
# NOTE: NEXT_PUBLIC_NETWORK_TYPE is baked at build time (required by @vechain/vechain-kit)
# The image is built with NETWORK_TYPE=main. App config is controlled by NEXT_PUBLIC_APP_ENV.
