FROM node:24.4.1

RUN corepack enable && corepack prepare pnpm@latest --activate

# Create base directories
WORKDIR /app
RUN mkdir -p /app/client /app/server

# Copy root package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy client files
COPY packages/client/package.json /app/client/
COPY packages/client/vite.config.ts /app/client/
COPY packages/client/index.html /app/client/
COPY packages/client/src /app/client/src/
COPY packages/client/tsconfig.json /app/client/

# Copy server files
COPY packages/server/package.json /app/server/
COPY packages/server/prisma /app/server/prisma/
COPY packages/server/src /app/server/src/
COPY packages/server/tsconfig.json /app/server/
COPY packages/server/index.ts /app/server/

# Copy shared configuration
COPY tsconfig.json tsconfig.build.json /app/

# Install dependencies and build
RUN pnpm install --shamefully-hoist
RUN cd /app/server && npx prisma generate --schema=./prisma/schema.prisma
RUN pnpm --filter client build
RUN pnpm --filter server build

# Set default command to ensure correct working directory
CMD ["sh", "-c", "cd /app/server && pnpm prisma:migrate:ci && node /app/dist/server/index.js"]
