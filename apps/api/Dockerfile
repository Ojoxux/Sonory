# syntax=docker/dockerfile:1
# Hono API Dockerfile (Node.js Runtime)
# Use specific version for security
FROM node:22-alpine3.21 AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the API
RUN cd apps/api && npm run build

# Production image
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono

# Copy built application
COPY --from=builder --chown=hono:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

USER hono

EXPOSE 8787

# Start the application with Node.js
CMD ["node", "apps/api/dist/index.js"]

# Development stage
FROM base AS development
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Install all dependencies including dev dependencies
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/ ./packages/
RUN npm ci

# Copy source code
COPY . .

# Build the API (development stage)
WORKDIR /app/apps/api
RUN npm run build

EXPOSE 8787

# Start development server with Node.js instead of wrangler
USER node
CMD ["npm", "run", "dev:node", "--prefix", "apps/api"]