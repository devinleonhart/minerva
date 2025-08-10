# Multi-stage Dockerfile for both development and production
FROM node:24.4.1 AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

# Create base directories
WORKDIR /app
RUN mkdir -p /app/packages/client /app/packages/server

# Copy root package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy client files
COPY packages/client/package.json /app/packages/client/
COPY packages/client/vite.config.ts /app/packages/client/
COPY packages/client/index.html /app/packages/client/
COPY packages/client/src /app/packages/client/src/
COPY packages/client/tsconfig.json /app/packages/client/

# Copy server files
COPY packages/server/package.json /app/packages/server/
COPY packages/server/prisma /app/packages/server/prisma/
COPY packages/server/src /app/packages/server/src/
COPY packages/server/tsconfig.json /app/packages/server/
COPY packages/server/index.ts /app/packages/server/

# Copy shared configuration
COPY tsconfig.json tsconfig.build.json /app/

# Install dependencies
RUN pnpm install --shamefully-hoist

# Development stage
FROM base AS development

# Generate Prisma client
RUN cd /app/packages/server && npx prisma generate --schema=./prisma/schema.prisma

# Set development command
CMD ["sh", "-c", "cd /app/packages/server && pnpm prisma:migrate:ci && pnpm dev"]

# Production build stage
FROM base AS production-build

# Generate Prisma client
RUN cd /app/packages/server && npx prisma generate --schema=./prisma/schema.prisma

# Build both client and server
RUN npx tsc --project packages/client/tsconfig.json
RUN npx tsc --project packages/server/tsconfig.json

# Production runtime stage
FROM node:24.4.1 AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy built files and dependencies from build stage
COPY --from=production-build /app/dist /app/dist
COPY --from=production-build /app/packages/server/prisma /app/server/prisma
COPY --from=production-build /app/packages/server/package.json /app/server/package.json
COPY --from=production-build /app/pnpm-lock.yaml /app/
COPY --from=production-build /app/package.json /app/

# Install only production dependencies
RUN pnpm install --prod --shamefully-hoist

# Set production command
CMD ["sh", "-c", "cd /app/server && pnpm prisma:migrate:ci && node /app/dist/server/index.js"]
