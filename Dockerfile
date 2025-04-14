FROM node:20.11.0 AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Create base directories
WORKDIR /app
RUN mkdir -p /app/client /app/server

# Copy root package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy client files
COPY client/package.json /app/client/
COPY client/vite.config.ts /app/client/
COPY client/index.html /app/client/
COPY client/src /app/client/src/
COPY client/tsconfig.json /app/client/

# Copy server files
COPY server/package.json /app/server/
COPY server/prisma /app/server/prisma/
COPY server/src /app/server/src/
COPY server/tsconfig.json /app/server/

# Copy shared configuration
COPY tsconfig.base.json /app/

# Install dependencies and build
RUN pnpm install --shamefully-hoist
RUN cd /app/server && npx prisma generate --schema=./prisma/schema.prisma
RUN pnpm -r build

# Production image
FROM node:20.11.0

WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/server/node_modules /app/server/node_modules

CMD ["node", "dist/server/index.js"]
