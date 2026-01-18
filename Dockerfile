FROM node:24.4.1 AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY pnpm-lock.yaml package.json ./

# Copy source code
COPY client/ /app/client/
COPY server/ /app/server/
COPY tsconfig.json tsconfig.build.json eslint.config.mjs /app/

RUN pnpm install --shamefully-hoist --ignore-scripts=false

FROM base AS development

RUN pnpm run prisma:generate

CMD ["sh", "-c", "pnpm run dev:server"]
