# syntax=docker/dockerfile:1.4
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

# Install dependencies with yarn cache mount
# Note: Project uses Yarn 1 (Classic) which caches at /usr/local/share/.cache/yarn
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile

# ============================================================================
# LAYER 2: Source code and build
# ============================================================================

# Copy source code BEFORE setting volatile ARGs to maximize cache hits
COPY packages ./packages
COPY apps ./apps

# Build arguments - minimal args for single-image build
# NEXT_PUBLIC_* vars come from .env.production (placeholders) and are substituted at runtime
ARG NODE_OPTIONS="--max-old-space-size=6144"
ARG SKIP_CONTRACTS_BUILD=false
ARG USE_NPM_CONTRACTS=false

ENV NODE_OPTIONS=${NODE_OPTIONS}
# Reduce memory usage during build
ENV GENERATE_SOURCEMAP=false
ENV NEXT_TELEMETRY_DISABLED=1

# If USE_NPM_CONTRACTS=true, switch to npm package instead of local workspace
# This skips Solidity compilation when contracts haven't changed
RUN if [ "$USE_NPM_CONTRACTS" = "true" ]; then \
      echo "Using npm @vechain/vebetterdao-contracts package (no local build needed)..." && \
      sed -i 's/"@vechain\/vebetterdao-contracts": "\*"/"@vechain\/vebetterdao-contracts": "latest"/g' apps/frontend/package.json && \
      yarn install --frozen-lockfile || yarn install; \
    fi

# Build the application with persistent caches:
# - Uses .env.production with placeholder values for NEXT_PUBLIC_* vars
# - Placeholders get substituted at container startup by docker-entrypoint.sh
# - Single build for all environments (staging/beta/prod)
# - SKIP_CONTRACTS_BUILD=true skips Solidity compilation (for local ARM64 testing)
RUN --mount=type=cache,target=/app/packages/contracts/cache,id=hardhat-cache \
    --mount=type=cache,target=/app/node_modules/.cache/turbo,id=turbo-cache \
    --mount=type=cache,target=/app/apps/frontend/.next/cache,id=nextjs-cache \
    if [ "$USE_NPM_CONTRACTS" = "true" ] || [ "$SKIP_CONTRACTS_BUILD" = "true" ]; then \
      echo "Building frontend only (skipping contracts)..." && \
      yarn workspace frontend build; \
    else \
      echo "Building with local contracts..." && \
      yarn build; \
    fi

# ============================================================================
# Production stage (standalone output - minimal image)
# ============================================================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output (includes minimal node_modules)
COPY --from=builder /app/apps/frontend/.next/standalone ./
# Copy static files (not included in standalone by default)
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
# Copy public folder
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

# Copy entrypoint script for runtime env substitution
COPY apps/frontend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

# Entrypoint substitutes NEXT_PUBLIC_* placeholders at container start
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "apps/frontend/server.js"]
