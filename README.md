# Minerva

## Scripts

```bash
pnpm dev          # Start development environment
pnpm start        # Start production environment
pnpm test         # Run tests
pnpm lint         # Run linting
pnpm tsc          # Type check
pnpm quality      # Run test + lint + tsc
pnpm clean        # Clean build artifacts
pnpm build        # Build for production
pnpm dev:client   # Start client only
pnpm dev:server   # Start server only
```

> **Docker-only backend commands:** Anything that touches the server (tests, Prisma, quality checks, etc.) must be run inside the Docker environment so it can reach the `postgres` and `postgres-test` containers. Use `docker compose run --rm server <command>`, e.g. `docker compose run --rm server pnpm run quality`.
