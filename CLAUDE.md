# Minerva

> **Active migration in progress** — see [MIGRATION.md](MIGRATION.md) for the phased plan to move from Express + Prisma + Vue to Nuxt + Drizzle.

A full-stack TypeScript web app for managing an alchemical/crafting system — recipes, ingredients, inventory, scheduling, NPCs, spells, and skills. Likely a companion tool for a tabletop RPG or game.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 24.14.0 |
| Package manager | pnpm | 10.30.3 |
| Frontend framework | Vue 3 | 3.5.29 |
| State management | Pinia | 3.0.4 |
| Routing | Vue Router | 5.0.3 |
| Build tool | Vite | 7.3.1 |
| CSS | Tailwind CSS | 4.2.1 |
| UI primitives | Radix Vue | 1.9.17 |
| Icons | Lucide Vue Next | 0.575.0 |
| HTTP client | axios | 1.13.6 |
| Backend framework | Express | 5.2.1 |
| ORM | Prisma | 7.4.2 |
| DB driver | pg | 8.19.0 |
| Database | PostgreSQL | 17.4 |
| Language | TypeScript | 5.9.3 |
| Test runner | Vitest | 4.0.18 |
| HTTP testing | Supertest | 7.2.2 |
| TS execution (dev) | tsx | 4.21.0 |

**Monorepo:** pnpm workspaces (`pnpm-workspace.yaml`) — `client/` and `server/` packages.
**Module system:** ES modules (`"type": "module"` in all package.json files).

### TypeScript Config
- **Server** (`server/tsconfig.json`): ES2023 target, strict mode, declaration files, source maps
- **Client** (`client/tsconfig.json`): ES2020 target, strict mode, path aliases:
  - `@/` → `src/`
  - `#/` → `types/`

### Vite Config (client)
- `@vitejs/plugin-vue` for SFC support
- `@tailwindcss/vite` for CSS
- API proxy: `/api/*` → `http://localhost:3000` (local dev), `http://server:3000` (Docker)

---

## Running the App

```bash
pnpm dev              # Full Docker dev environment (recommended)
pnpm dev:client       # Vite client only — port 5173
pnpm dev:server       # Express server only — port 3000
```

### Ports
| Service | Port |
|---|---|
| Client (Docker Vite) | 8080 |
| Server (Express) | 3000 |
| PostgreSQL dev DB | 5432 |
| PostgreSQL test DB | 5433 |

### Docker Compose Services
| Service | Port | Purpose |
|---|---|---|
| client | 8080 | Vite dev server |
| server | 3000 | Express API |
| postgres | 5432 | Dev database (`minerva`) |
| postgres-test | 5433 | Test database (`minerva_test`) |
| prisma | — | Prisma Studio GUI |

---

## Database

```bash
pnpm prisma:generate  # Regenerate Prisma client after schema changes
pnpm prisma:migrate   # Run pending migrations
pnpm prisma:studio    # Open Prisma Studio GUI
pnpm db:seed          # Seed the database
```

- **Schema:** `server/prisma/schema.prisma`
- **Migrations:** `server/prisma/migrations/`
- **Prisma config:** `server/prisma/prisma.config.ts`
- **Client init:** `server/src/db.ts` (uses `PrismaPg` adapter with `pg` Pool)
- **Generated types:** `server/src/generated/`
- **DB URL selection:** `server/src/config/databaseUrls.ts` — picks URL based on `NODE_ENV` (development / test / production)

### Schema — Enums

```prisma
enum PotionQuality     { NORMAL, HQ, LQ }
enum IngredientQuality { NORMAL, HQ, LQ }
enum TimeSlot          { MORNING, AFTERNOON, EVENING }
enum TaskType {
  GATHER_INGREDIENT
  BREWING
  SECURE_INGREDIENTS
  RESEARCH_RECIPES
  RESEARCH_SPELL
  FREE_TIME
}
```

### Schema — Models

**Recipe system**
```prisma
model Recipe {
  id          Int                @id @default(autoincrement())
  name        String
  description String?
  ingredients RecipeIngredient[]
  potions     Potion[]
}

model Ingredient {
  id             Int                @id @default(autoincrement())
  name           String
  quality        IngredientQuality  @default(NORMAL)
  recipes        RecipeIngredient[]
  inventoryItems InventoryItem[]
}

model RecipeIngredient {
  id           Int        @id @default(autoincrement())
  recipeId     Int
  ingredientId Int
  quantity     Int
  recipe       Recipe     @relation(fields: [recipeId], references: [id])
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id])
}

model Potion {
  id             Int                   @id @default(autoincrement())
  name           String
  quality        PotionQuality         @default(NORMAL)
  recipeId       Int?
  recipe         Recipe?               @relation(fields: [recipeId], references: [id])
  inventoryItems PotionInventoryItem[]
}
```

**Inventory system**
```prisma
model InventoryItem {
  id           Int               @id @default(autoincrement())
  ingredientId Int
  quality      IngredientQuality @default(NORMAL)
  quantity     Int               @default(0)
  ingredient   Ingredient        @relation(fields: [ingredientId], references: [id])
}

model PotionInventoryItem {
  id       Int    @id @default(autoincrement())
  potionId Int
  quantity Int    @default(0)
  potion   Potion @relation(fields: [potionId], references: [id])
}

model ItemInventoryItem {
  id       Int  @id @default(autoincrement())
  itemId   Int
  quantity Int  @default(0)
  item     Item @relation(fields: [itemId], references: [id])
}

model Item {
  id             Int                 @id @default(autoincrement())
  name           String
  inventoryItems ItemInventoryItem[]
}

model Currency {
  id     Int @id @default(autoincrement())
  amount Int @default(0)
}
```

**Scheduling system**
```prisma
model WeekSchedule {
  id   Int           @id @default(autoincrement())
  days DaySchedule[]
}

model DaySchedule {
  id             Int             @id @default(autoincrement())
  weekScheduleId Int
  weekSchedule   WeekSchedule    @relation(fields: [weekScheduleId], references: [id])
  tasks          ScheduledTask[]
}

model ScheduledTask {
  id               Int            @id @default(autoincrement())
  dayScheduleId    Int
  taskDefinitionId Int
  timeSlot         TimeSlot
  notes            String?
  daySchedule      DaySchedule    @relation(fields: [dayScheduleId], references: [id])
  taskDefinition   TaskDefinition @relation(fields: [taskDefinitionId], references: [id])
}

model TaskDefinition {
  id        Int             @id @default(autoincrement())
  name      String          @unique
  type      TaskType
  timeUnits Int
  color     String
  tasks     ScheduledTask[]
}
```

**Character / world system**
```prisma
model Person {
  id            Int     @id @default(autoincrement())
  name          String
  relationship  String?
  notableEvents String?
  url           String?
}

model Skill {
  id   Int    @id @default(autoincrement())
  name String @unique
}

model Spell {
  id           Int     @id @default(autoincrement())
  name         String
  currentStars Int     @default(0)
  neededStars  Int
  isLearned    Boolean @default(false)
}
```

---

## Testing & Quality

```bash
pnpm test                   # All tests (client + server)
pnpm test:client            # Vitest — Vue component tests
pnpm test:server            # Vitest — server/API tests
pnpm test:server:coverage   # Server tests with coverage report
pnpm lint                   # ESLint
pnpm lint:fix               # ESLint with auto-fix
pnpm tsc                    # TypeScript type check (vue-tsc for client)
pnpm quality                # lint + tsc + all tests
```

- Server tests run **sequentially** (`maxWorkers: 1`) to avoid DB conflicts
- **70% coverage threshold** enforced on the server
- Test setup files: `server/test/setup.ts`, `server/test/globalSetup.ts`, `server/test/helpers.ts`

---

## Code Style

Enforced by ESLint (`eslint.config.mjs`, flat config with Vue + TypeScript rules):
- **2-space indentation**
- **Single quotes**
- **No semicolons**
- ES modules throughout

---

## Project Structure

```
minerva/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/     AppLayout, NavBar, PageLayout, ConfirmDialog
│   │   │   ├── ui/         Radix Vue primitives: badge, button, card, checkbox,
│   │   │   │               dialog, input, label, select, table, textarea, toast
│   │   │   └── features/   Domain components: ingredients, inventory, people,
│   │   │                   recipes, scheduler, skills, spells
│   │   ├── views/          Page-level components (one per route)
│   │   ├── store/          Pinia stores (one per domain)
│   │   ├── composables/    useApi, useCrud, useSearch, useConfirm, useToast
│   │   ├── router/         Vue Router config
│   │   ├── types/          TypeScript types (components.ts, utils.ts, store/)
│   │   └── styles/         main.css
│   └── test/               Component tests
├── server/
│   ├── index.ts            Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   ├── migrations/
│   │   └── prisma.config.ts
│   ├── src/
│   │   ├── db.ts           Prisma client singleton (PrismaPg adapter)
│   │   ├── config/         databaseUrls.ts
│   │   ├── routes/         One folder per resource
│   │   ├── utils/          parseId.ts, handleUnknownError.ts
│   │   ├── generated/      Prisma auto-generated types
│   │   └── services/
│   └── test/
│       ├── setup.ts
│       ├── globalSetup.ts
│       └── helpers.ts
├── package.json            Root monorepo scripts
├── pnpm-workspace.yaml
├── docker-compose.yml
├── Dockerfile              Multi-stage build
└── .github/workflows/      CI/CD (publish workflow)
```

---

## API Routes

All routes under `/api/`:

| Route | Methods | Notes |
|---|---|---|
| `/ingredients` | CRUD | |
| `/inventory` | Complex | Ingredients, potions, items, currency |
| `/recipes` | CRUD | |
| `/recipes/craftable` | GET | Returns recipes you have ingredients to craft |
| `/recipes/:id/deletable` | GET | Check if recipe can be safely deleted |
| `/potions` | GET, POST | |
| `/items` | CRUD | |
| `/scheduler` | GET, POST | |
| `/scheduler/load` | POST | Load a saved schedule |
| `/scheduler/save` | POST | Persist current schedule |
| `/scheduler/delete` | POST | Delete a schedule |
| `/scheduler/cleanup` | POST | Clean up orphaned schedule data |
| `/inventory/currency` | POST | Add currency |
| `/people` | CRUD | |
| `/skills` | CRUD | |
| `/spells` | CRUD | |

---

## Frontend Patterns

### Routes
| Path | View | Notes |
|---|---|---|
| `/` | — | Redirects to `/recipes` |
| `/ingredients` | IngredientView | |
| `/inventory` | InventoryView | |
| `/recipes` | RecipeView | Default landing |
| `/scheduler` | SchedulerView | |
| `/people` | PeopleView | |
| `/spells` | SpellsView | |
| `/skills` | SkillsView | |

### Pinia Stores
One store per domain: `ingredient`, `inventory`, `item`, `people`, `potion`, `recipe`, `scheduler`, `skills`, `spells`. All API calls go through the `useApi` composable.

### Composables
- `useApi` — Axios wrapper for HTTP calls
- `useCrud` — Generic CRUD operations reused across features
- `useSearch` — Search/filter logic
- `useConfirm` — Confirmation dialog integration
- `useToast` — Toast notification integration

### Component Organization
- `layout/` — Structural shell, always present
- `ui/` — Generic Radix Vue-based primitives
- `features/` — Domain-specific components, one folder per resource

---

## Backend Patterns

- Each resource has its own directory under `server/src/routes/` with separate handler files per operation
- Error handling: `handleUnknownError.ts` utility used in route handlers
- ID parsing: `parseId.ts` utility for parsing integer route params
- Single Prisma client instance exported from `server/src/db.ts`
