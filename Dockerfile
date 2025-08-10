FROM node:24.4.1 AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
RUN mkdir -p /app/packages/client /app/packages/server

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

COPY packages/client/package.json /app/packages/client/
COPY packages/client/vite.config.ts /app/packages/client/
COPY packages/client/index.html /app/packages/client/
COPY packages/client/src /app/packages/client/src/
COPY packages/client/tsconfig.json /app/packages/client/

COPY packages/server/package.json /app/packages/server/
COPY packages/server/prisma /app/packages/server/prisma/
COPY packages/server/src /app/packages/server/src/
COPY packages/server/tsconfig.json /app/packages/server/
COPY packages/server/index.ts /app/packages/server/

COPY tsconfig.json tsconfig.build.json /app/

RUN pnpm install --shamefully-hoist

FROM base AS development

RUN cd /app/packages/server && npx prisma generate --schema=./prisma/schema.prisma

CMD ["sh", "-c", "cd /app/packages/server && pnpm prisma:migrate:ci && pnpm dev"]

FROM base AS production-build

RUN cd /app/packages/server && npx prisma generate --schema=./prisma/schema.prisma

RUN pnpm --filter client build
RUN pnpm --filter server build

FROM node:24.4.1 AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=production-build /app/dist /app/dist
COPY --from=production-build /app/packages/server/prisma /app/server/prisma
COPY --from=production-build /app/packages/server/package.json /app/server/package.json

WORKDIR /app/server
RUN pnpm install --prod

WORKDIR /app
RUN pnpm add prisma

CMD ["sh", "-c", "cd /app/server && npx prisma migrate deploy && node /app/dist/server/index.js"]
