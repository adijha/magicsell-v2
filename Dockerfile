# Multi-stage build for production deployment
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Build the application
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev)
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the app
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 reactrouter

# Copy necessary files from builder
COPY --from=deps --chown=reactrouter:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=reactrouter:nodejs /app/prisma ./prisma
COPY --from=builder --chown=reactrouter:nodejs /app/build ./build
COPY --from=builder --chown=reactrouter:nodejs /app/public ./public
COPY --from=builder --chown=reactrouter:nodejs /app/package*.json ./

# Copy extensions (for theme extension metadata)
COPY --chown=reactrouter:nodejs extensions ./extensions

USER reactrouter

EXPOSE 8080

# Start the app
CMD ["npm", "run", "docker-start"]
