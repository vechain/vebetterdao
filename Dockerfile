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

# Build arguments
ARG APP_BUILD_ENV=prod
ARG NEXT_PUBLIC_APP_ENV

# Set Node.js memory for both Node and WASM (Solidity compiler)
ENV APP_BUILD_ENV=${APP_BUILD_ENV}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV NODE_OPTIONS="--max-old-space-size=6144"

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
