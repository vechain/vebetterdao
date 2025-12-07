# Build stage
FROM node:20 AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# ============================================================================
# LAYER 1: Dependencies (cached unless package.json files change)
# ============================================================================

# Copy root dependency files
COPY package.json yarn.lock turbo.json ./

# Copy only package.json files from workspaces (not source code)
# This ensures yarn install is cached unless dependencies change
COPY packages/config/package.json ./packages/config/
COPY packages/constants/package.json ./packages/constants/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/lambda/package.json ./packages/lambda/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/utils/package.json ./packages/utils/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN yarn install --frozen-lockfile

# ============================================================================
# LAYER 2: Source code and build
# ============================================================================

# Build arguments
ARG APP_BUILD_ENV
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_DELEGATOR_URL
ARG NEXT_PUBLIC_IPFS_PINNING_SERVICE
ARG NEXT_PUBLIC_NETWORK_TYPE
ARG NEXT_PUBLIC_NFT_STORAGE_KEY
ARG NEXT_PUBLIC_PRIVY_APP_ID
ARG NEXT_PUBLIC_PRIVY_CLIENT_ID
ARG NEXT_PUBLIC_TRANSAK_API_KEY
ARG NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN
ARG NEXT_PUBLIC_DATADOG_ENV
ARG NEXT_PUBLIC_DATADOG_APP_TOKEN
ARG NEXT_PUBLIC_DATADOG_CLIENT_TOKEN
ARG NODE_OPTIONS

# Set environment variables for build
ENV APP_BUILD_ENV=${APP_BUILD_ENV}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV NEXT_PUBLIC_DELEGATOR_URL=${NEXT_PUBLIC_DELEGATOR_URL}
ENV NEXT_PUBLIC_IPFS_PINNING_SERVICE=${NEXT_PUBLIC_IPFS_PINNING_SERVICE}
ENV NEXT_PUBLIC_NETWORK_TYPE=${NEXT_PUBLIC_NETWORK_TYPE}
ENV NEXT_PUBLIC_NFT_STORAGE_KEY=${NEXT_PUBLIC_NFT_STORAGE_KEY}
ENV NEXT_PUBLIC_PRIVY_APP_ID=${NEXT_PUBLIC_PRIVY_APP_ID}
ENV NEXT_PUBLIC_PRIVY_CLIENT_ID=${NEXT_PUBLIC_PRIVY_CLIENT_ID}
ENV NEXT_PUBLIC_TRANSAK_API_KEY=${NEXT_PUBLIC_TRANSAK_API_KEY}
ENV NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=${NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
ENV NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN=${NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN}
ENV NEXT_PUBLIC_DATADOG_ENV=${NEXT_PUBLIC_DATADOG_ENV}
ENV NEXT_PUBLIC_DATADOG_APP_TOKEN=${NEXT_PUBLIC_DATADOG_APP_TOKEN}
ENV NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=${NEXT_PUBLIC_DATADOG_CLIENT_TOKEN}
ENV NODE_OPTIONS=${NODE_OPTIONS}

# Copy source code
COPY packages ./packages
COPY apps ./apps

# Build the application
RUN case "$APP_BUILD_ENV" in \
      "staging") yarn build:staging ;; \
      "dev") yarn build:testnet ;; \
      "beta") yarn build:mainnet ;; \
      "prod") yarn build:mainnet ;; \
      *) echo "Unknown APP_BUILD_ENV: $APP_BUILD_ENV" >&2; exit 1 ;; \
    esac

# ============================================================================
# Production stage (minimal image)
# ============================================================================
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed to run the application
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages

EXPOSE 3000

CMD ["yarn", "workspace", "frontend", "start", "--hostname", "0.0.0.0", "--port", "3000"]
