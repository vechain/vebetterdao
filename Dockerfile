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

# NEXT_PUBLIC_* values are injected at runtime via window.__ENV__ (see apps/frontend/src/app/layout.tsx),
# so we no longer need per-env build args. One image ships to every environment.
ARG NODE_OPTIONS
ENV NODE_OPTIONS=${NODE_OPTIONS}

# Build the application with persistent caches:
# - Hardhat cache: Persists Solidity compiler downloads (no more "Downloading compiler 0.8.20")
# - Turbo cache: Persists turbo build cache across builds
# - Next.js cache: Persists Next.js build cache
RUN --mount=type=cache,target=/app/packages/contracts/cache,id=hardhat-cache \
    --mount=type=cache,target=/app/node_modules/.cache/turbo,id=turbo-cache \
    --mount=type=cache,target=/app/apps/frontend/.next/cache,id=nextjs-cache \
    yarn build:mainnet

# ============================================================================
# Production stage (minimal image)
# ============================================================================
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# standalone omits static/ and public/ — copy them separately
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3000

# App Runner injects HOSTNAME at runtime; force it here so server.js binds to 0.0.0.0
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 exec node apps/frontend/server.js"]
