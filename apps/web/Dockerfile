# syntax=docker/dockerfile:1
# Next.js Web Application Dockerfile
# Use specific version for security
FROM node:22-alpine3.21 AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ ./packages/

# Install dependencies required for the production build
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the web application
RUN cd apps/web && npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000

# Start the application
CMD ["npm", "run", "start", "--prefix", "apps/web"]

# Development stage
FROM base AS development
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user early
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install all dependencies including dev dependencies
COPY package*.json ./
COPY turbo.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ ./packages/
RUN npm ci

# Copy source code
COPY --chown=nextjs:nodejs . .

# Create and set permissions for .next directory
RUN mkdir -p /app/apps/web/.next && \
    chown -R nextjs:nodejs /app/apps/web/.next

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--prefix", "apps/web"]
