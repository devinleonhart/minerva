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

# Bundle the migration script as a self-contained ESM file alongside the SQL files
RUN node_modules/.bin/esbuild server/db/migrate.ts \
      --bundle \
      --platform=node \
      --format=esm \
      --external:pg-native \
      "--banner:js=import { createRequire } from 'module'; const require = createRequire(import.meta.url);" \
      --outfile=.output/migrations/migrate.mjs && \
    cp server/db/*.sql .output/migrations/ && \
    cp -r server/db/meta .output/migrations/meta

# Production stage
FROM node:24.14.0-slim AS production

WORKDIR /app

COPY --from=build /app/.output ./
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production

EXPOSE 3000

CMD ["/app/docker-entrypoint.sh"]
