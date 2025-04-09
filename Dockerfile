FROM node:20.11.0
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
COPY . .
RUN pnpm install --recursive --shamefully-hoist
RUN pnpm -r build
WORKDIR /app
CMD ["node", "dist/server/index.js"]
