FROM node:24.14.0-slim AS base

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app

COPY pnpm-lock.yaml package.json ./

RUN pnpm install --shamefully-hoist --ignore-scripts=false

# Development stage
FROM base AS development

COPY . .

RUN pnpm nuxt prepare

CMD ["pnpm", "run", "dev"]

# Build stage
FROM base AS build

COPY . .

RUN pnpm run build

# Production stage
FROM node:24.14.0-slim AS production

WORKDIR /app

COPY --from=build /app/.output ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server/index.mjs"]
