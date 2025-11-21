# Build stage
FROM node:20 AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json yarn.lock turbo.json ./
COPY packages ./packages
COPY apps ./apps
RUN yarn install --frozen-lockfile

# Build arguments (public config needed at build time)
ARG APP_BUILD_ENV=prod
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_DELEGATOR_URL
ARG NEXT_PUBLIC_IPFS_PINNING_SERVICE
ARG NEXT_PUBLIC_NETWORK_TYPE
ARG NEXT_PUBLIC_NFT_STORAGE_KEY
ARG NEXT_PUBLIC_PRIVY_APP_ID
ARG NEXT_PUBLIC_PRIVY_CLIENT_ID
ARG NEXT_PUBLIC_TRANSAK_API_KEY
ARG NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
ARG NODE_OPTIONS

# Set Node.js memory for both Node and WASM (Solidity compiler)
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
ENV NODE_OPTIONS=${NODE_OPTIONS}

# Copy source and build
COPY . .
RUN case "$APP_BUILD_ENV" in \
      "staging") yarn build:staging ;; \
      "dev") yarn build:testnet ;; \
      "beta") yarn build:mainnet ;; \
      "prod") yarn build:mainnet ;; \
      *) echo "Unknown APP_BUILD_ENV: $APP_BUILD_ENV" >&2; exit 1 ;; \
    esac

# Production stage
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/turbo.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages

EXPOSE 3000

CMD ["yarn", "workspace", "frontend", "start", "--hostname", "0.0.0.0", "--port", "3000"]
