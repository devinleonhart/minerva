# Migration Plan: Express + Prisma + Vue → Nuxt + Drizzle

## Goal
Replace the current split client/server architecture with a single Nuxt 3 app backed by Drizzle ORM. Remove Prisma and its codegen step. Keep PostgreSQL and Docker (prod-only).

## Guiding principles
- Every phase leaves the app in a fully working, deployable state
- No phase changes the public API surface (`/api/*` routes stay identical)
- All tests must pass at the end of each phase before moving on
- Use latest stable versions of all dependencies at the time of each phase

## Phases overview

| # | Phase | Removes | Adds | Risk |
|---|---|---|---|---|
| 1 | Upgrade all dependencies | — | Latest versions | Low |
| 2 | Replace Prisma with Drizzle | Prisma, adapter, codegen, generated/ | drizzle-orm, drizzle-kit | Medium |
| 3 | Introduce Nuxt, migrate frontend | Vue Router, standalone Vite | Nuxt, @pinia/nuxt | Medium |
| 4 | Migrate Express to Nuxt server routes | Express, cors, nodemon, tsx | Nuxt server/api/ (H3) | High |
| 5 | Simplify Docker & CI | 5-service Compose | 2-service Compose | Low |

---

## Phase 1 — Upgrade all dependencies ✅ COMPLETE

**Goal:** Establish a clean baseline at latest stable versions before any structural changes.

**Actions:**
1. Update Node to latest LTS in `.nvmrc` and `.tool-versions` (verify at nodejs.org)
2. Update pnpm to latest in `.tool-versions`
3. Run `pnpm update --latest` and review all changed packages for breaking changes
4. Fix any breaking change issues (check changelogs for Vue, Pinia, Express, Prisma, Vite, Vitest, TypeScript, ESLint)
5. Run `pnpm quality` — all checks must pass
6. Deploy and smoke test

**What to watch:**
- Prisma major versions may have migration changes — review but don't linger, it's being replaced in Phase 2
- ESLint flat config changes
- Vitest and `@vue/test-utils` compatibility

**Deliverable:** Same app, all dependencies current. Green CI.

---

## Phase 2 — Replace Prisma with Drizzle

**Goal:** Remove Prisma and its codegen step entirely. Express routes and Vue frontend unchanged.

### Remove
- `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `@prisma/client-runtime-utils`
- `server/prisma/prisma.config.ts`
- `server/prisma/schema.prisma`
- `server/prisma/migrations/`
- `server/src/generated/`
- `prisma:generate`, `prisma:migrate`, `prisma:studio` scripts

### Add
- `drizzle-orm` (latest)
- `drizzle-kit` (latest)

### Step-by-step

**2a. Introspect existing schema**

Run `drizzle-kit introspect` against the dev database to auto-generate `server/db/schema.ts` from the existing PostgreSQL tables. This avoids manually rewriting the schema.

```bash
drizzle-kit introspect --dialect=postgresql --url=postgresql://postgres:postgres@localhost:5432/minerva
```

Review and clean up the generated `schema.ts` — add relation definitions, verify enum mappings.

**2b. Add `drizzle.config.ts`** at root:
```ts
import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
```

**2c. Rewrite `server/src/db.ts`:**
```ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../db/schema.js'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
```

**2d. Simplify `server/src/config/databaseUrls.ts`** → just two env vars: `DATABASE_URL` and `TEST_DATABASE_URL`. Remove the Docker hostname fallback logic — Docker sets `DATABASE_URL` directly via environment in Compose.

**2e. Rewrite all route handlers** — swap Prisma queries for Drizzle queries in all 54 route files. Drizzle uses `db.select().from(table)`, `db.insert(table).values(...)`, `db.update(table).set(...).where(...)`, `db.delete(table).where(...)`.

**2f. Update test infrastructure:**
- `server/test/globalSetup.ts`: replace `pnpm prisma db push` with `drizzle-kit push --config=drizzle.config.ts`
- `server/test/setup.ts`: replace all `testPrisma.*` calls with Drizzle queries against the test DB
- `server/test/helpers.ts`: no changes needed (still creates the same Express test app)

**2g. Update Docker Compose:** remove the `prisma` service. Add `drizzle-kit studio` script if desired.

**2h. Update `package.json` scripts:**
```json
"db:push":    "drizzle-kit push",
"db:studio":  "drizzle-kit studio",
"db:migrate": "drizzle-kit migrate",
"db:seed":    "tsx server/prisma/seed.ts"
```

**Test:** All existing server route tests (`server/test/routes/*.test.ts`) and utility tests must still pass. No frontend changes, no API changes.

**Deploy:** Same Docker Compose minus the `prisma` service.

---

## Phase 3 — Introduce Nuxt, migrate frontend

**Goal:** Replace Vue Router + standalone Vite with Nuxt. Express API continues to run alongside; Nuxt proxies `/api/*` to it.

### Remove
- `client/vite.config.ts`
- `client/src/router/index.ts`
- `vue-router`
- `@vitejs/plugin-vue` (Nuxt bundles its own)
- `vite` as a standalone dependency (Nuxt bundles its own)
- `dev:client` script

### Add
- `nuxt` (latest stable — use Nuxt 4 if stable at time of migration, otherwise latest 3.x)
- `@pinia/nuxt`
- `@nuxtjs/tailwindcss` (or configure Tailwind via `nuxt.config.ts`)

### Step-by-step

**3a. Add `nuxt.config.ts`** at root:
```ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  routeRules: {
    '/api/**': { proxy: 'http://localhost:3000/api/**' },
  },
})
```

The `routeRules` proxy means the existing Express server handles all `/api/` traffic during this phase — no backend changes needed.

**3b. Migrate file structure:**

| Before | After |
|---|---|
| `client/src/views/*.vue` | `pages/*.vue` |
| `client/src/components/` | `components/` |
| `client/src/store/` | `stores/` |
| `client/src/composables/` | `composables/` |
| `client/src/types/` | `types/` |
| `client/src/styles/main.css` | `assets/css/main.css` |

**3c. Remove explicit imports of composables and stores** — Nuxt auto-imports everything from `composables/`, `stores/`, and `utils/`. Remove `import { useX } from '@/composables/useX'` etc. across all components.

**3d. Router migration** — delete `router/index.ts`. Nuxt derives routes from the `pages/` directory. File names map directly:
- `pages/ingredients.vue` → `/ingredients`
- `pages/inventory.vue` → `/inventory`
- `pages/index.vue` → `/` (replace the redirect with a `navigateTo('/recipes')` in `app.vue` or a `pages/index.vue` that redirects)

**3e. Update `app.vue`** to remove manual router setup — Nuxt provides `<NuxtPage />` instead of `<router-view />`.

**3f. Path aliases** — `@/` still works in Nuxt via `nuxt.config.ts` alias config.

**3g. Update `package.json` scripts:**
```json
"dev":         "nuxt dev",         // frontend only (proxies to Express)
"dev:server":  "nodemon ...",       // Express still runs separately in dev
"build":       "nuxt build",
"test:client": "vitest run --config client/vitest.config.ts"
```

Client tests: Nuxt has `@nuxt/test-utils` for component testing, but existing `@testing-library/vue` tests may work with minor setup changes.

**Test:** All client component tests pass. Manually verify all pages/routes work. Server tests unchanged.

**Deploy:** Docker Compose gains a `nuxt` service, keeps the `server` (Express) service. In prod, Nuxt proxies `/api` to Express container.

---

## Phase 4 — Migrate Express to Nuxt server routes

**Goal:** Move all 54 Express route handlers into `server/api/` using H3. Remove Express entirely.

### Remove
- `express`, `@types/express`
- `cors`, `@types/cors`
- `nodemon`
- `tsx` (Nuxt handles TypeScript execution)
- `server/index.ts`
- `server/src/routes/` (all 54 files)
- `dev:server` script
- `routeRules` proxy from `nuxt.config.ts`

### Nuxt server route conventions

Nuxt maps filenames to HTTP methods and URL params:

| Express | Nuxt server/api/ |
|---|---|
| `GET /api/ingredients` | `server/api/ingredients/index.get.ts` |
| `POST /api/ingredients` | `server/api/ingredients/index.post.ts` |
| `GET /api/ingredients/:id` | `server/api/ingredients/[id].get.ts` |
| `PUT /api/ingredients/:id` | `server/api/ingredients/[id].put.ts` |
| `DELETE /api/ingredients/:id` | `server/api/ingredients/[id].delete.ts` |
| `GET /api/recipes/craftable` | `server/api/recipes/craftable.get.ts` |
| `POST /api/scheduler/load` | `server/api/scheduler/load.post.ts` |

Each handler uses H3 utilities instead of `req`/`res`:
```ts
// Express
export const handler = (req: Request, res: Response) => {
  const id = parseId(req.params.id)
  const body = req.body
  res.json(result)
  res.status(404).json({ error: 'Not found' })
}

// Nuxt / H3 equivalent
export default defineEventHandler(async (event) => {
  const id = parseId(getRouterParam(event, 'id'))
  const body = await readBody(event)
  return result
  throw createError({ statusCode: 404, message: 'Not found' })
})
```

`parseId.ts` and `handleUnknownError.ts` utils move to `server/utils/` — Nuxt auto-imports them in server routes.

### Migration order (simplest to most complex)

Migrate one resource group at a time. At each step, remove the Express route and the Nuxt proxy rule for that path, letting the new Nuxt server route handle it.

1. **people, skills, spells** — simple CRUD, no relations
2. **ingredients, items** — simple CRUD
3. **potions** — simple, small surface
4. **recipes** — includes `craftable` and `deletable` special endpoints
5. **inventory** — most files, most complexity
6. **scheduler** — most complex logic (load/save/cleanup/delete)

After all groups are migrated:
- Remove the `routeRules` proxy entirely
- Remove Express and all its dependencies
- Delete `server/index.ts` and `server/src/routes/`

### Update test infrastructure

Current tests use Supertest against an Express app created by `createTestApp()`. Options:

- **Option A (recommended):** Keep Vitest, replace Supertest with `@nuxt/test-utils` — use `setup({ server: true })` and `$fetch('/api/...')` for HTTP-level tests
- **Option B:** Adapt `server/test/helpers.ts` to use H3's `toNodeListener` to wrap event handlers — lets you keep Supertest with minimal changes per route

`server/test/globalSetup.ts`: remove Prisma reference (already done in Phase 2). Update to `drizzle-kit push` if not already.

**Test:** All route tests pass against new Nuxt server routes. Run `pnpm quality`.

**Deploy:** Remove `server` service from Docker Compose. Single `app` (Nuxt) service + `postgres`.

---

## Phase 5 — Simplify Docker & CI

**Goal:** Clean up infrastructure to match the simplified single-app architecture.

### Dockerfile
```dockerfile
FROM node:lts-alpine AS build
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install && pnpm build

FROM node:lts-alpine
WORKDIR /app
COPY --from=build /app/.output ./
ENV NODE_ENV=production
CMD ["node", "server/index.mjs"]
```

### docker-compose.yml (prod)
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/minerva
    depends_on:
      - postgres

  postgres:
    image: postgres:latest
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: minerva
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Remove entirely:** `postgres-test` service (test DB handled by `TEST_DATABASE_URL` env var in CI), `client` service, `server` service, `prisma` service.

### CI updates
- Update GitHub Actions to set `DATABASE_URL` and `TEST_DATABASE_URL` for test runs
- Update build step from current multi-command build to `nuxt build`

**Deliverable:** `pnpm dev` locally, `docker compose up` in prod. Done.

---

## Dependency version notes

Check latest stable at the start of each phase. Key packages to verify:

| Package | Check at |
|---|---|
| Node LTS | Phase 1 (nodejs.org/en/download) |
| `nuxt` | Phase 3 (nuxt.com) |
| `drizzle-orm` + `drizzle-kit` | Phase 2 (orm.drizzle.team) |
| `@pinia/nuxt` | Phase 3 |
| `@nuxt/test-utils` | Phase 4 |
| `postgres` image tag | Phase 5 |

Do not pin to the versions in this document — always install `@latest` at the time of each phase.
