# syntax=docker/dockerfile:1.7

###############################################################################
# Base image – shared between stages
###############################################################################
FROM node:20-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

WORKDIR /app

# System deps required by many npm packages (canvas, sharp, etc.)
RUN apk add --no-cache libc6-compat git python3 make g++ \
 && npm install -g yarn@1.22.22

###############################################################################
# Install dependencies once (leveraged by other stages)
###############################################################################
FROM base AS deps

# Copy monorepo manifests/workspace definitions first for better layer caching
COPY package.json yarn.lock turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN yarn install --frozen-lockfile --non-interactive

###############################################################################
# Build the Next.js frontend
###############################################################################
FROM deps AS builder

ARG NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}

ARG NODE_OPTIONS
ENV NODE_OPTIONS=${NODE_OPTIONS}

# Copy the remainder of the repository (shared configs, tooling, etc.)
COPY . .

RUN yarn workspace frontend build

###############################################################################
# Production runtime
###############################################################################
FROM base AS runner

# Use non-root user provided by the Node image
USER node

# Reuse installed dependencies & built artifacts from previous stages
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/yarn.lock ./yarn.lock
COPY --chown=node:node --from=builder /app/turbo.json ./turbo.json
COPY --chown=node:node --from=builder /app/apps ./apps
COPY --chown=node:node --from=builder /app/packages ./packages
COPY --chown=node:node --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --chown=node:node --from=builder /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3000

CMD ["yarn", "workspace", "frontend", "start", "--hostname", "0.0.0.0", "--port", "3000"]

