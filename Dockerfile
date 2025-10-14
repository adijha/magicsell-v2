# Multi-stage build for production deployment using Bun
FROM oven/bun:1 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install --production --frozen-lockfile

# Generate Prisma Client
RUN bun x prisma generate

# Build the application
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY prisma ./prisma/
COPY postcss.config.js ./
COPY tailwind.config.js ./

# Install all dependencies (including dev)
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Generate Prisma Client
RUN bun x prisma generate

# Build the app
RUN bun run build

# Production image with Node.js runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install Node.js and npm for Prisma migrations (before switching user)
RUN apk add --no-cache nodejs npm

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 reactrouter

# Copy necessary files from builder
COPY --from=deps --chown=reactrouter:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=reactrouter:nodejs /app/prisma ./prisma
COPY --from=builder --chown=reactrouter:nodejs /app/build ./build
COPY --from=builder --chown=reactrouter:nodejs /app/public ./public
COPY --from=builder --chown=reactrouter:nodejs /app/package.json ./

# Copy extensions (for theme extension metadata)
COPY --chown=reactrouter:nodejs extensions ./extensions

USER reactrouter

EXPOSE 8080

# Start the app with migrations
CMD ["sh", "-c", "npx prisma migrate deploy && npx react-router-serve ./build/server/index.js"]
