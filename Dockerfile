FROM node:24.13.0-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

# Copy package files
COPY pnpm-lock.yaml package.json ./

# Copy source code
COPY client/ /app/client/
COPY server/ /app/server/
COPY eslint.config.mjs /app/

RUN pnpm install --shamefully-hoist --ignore-scripts=false

# Development stage
FROM base AS development

RUN pnpm run prisma:generate

CMD ["sh", "-c", "pnpm run dev:server"]

# Build stage
FROM base AS build

RUN pnpm run prisma:generate
RUN pnpm run build:client
RUN pnpm run build:server

# Production stage
FROM node:24.13.0-slim AS production

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built artifacts
COPY --from=build /app/dist /app/dist
COPY --from=build /app/server/prisma /app/server/prisma
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/server/index.js"]
