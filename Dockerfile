FROM node:24.4.1

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

# Install dependencies and build
RUN pnpm install --shamefully-hoist
RUN cd /app/packages/server && npx prisma generate --schema=./prisma/schema.prisma
RUN cd /app/packages/client && pnpm build
RUN cd /app/packages/server && pnpm build

# Set default command to ensure correct working directory
CMD ["sh", "-c", "cd /app/packages/server && pnpm prisma:migrate:ci && node /app/dist/server/index.js"]
