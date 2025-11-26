# Minerva Project Documentation

## Project Overview

Minerva is a full-stack web application for managing a fantasy alchemy/potion-crafting system. The application allows users to:
- Manage recipes, ingredients, and potions with quality tiers (Normal/HQ/LQ)
- Track inventory of ingredients, potions, and items
- Schedule weekly tasks (gathering, brewing, research, etc.)
- Manage people/characters and relationships
- Track spells and skills progression

The application appears to be inspired by potion-crafting mechanics from games, with features like Crystal Cauldron essences (Fire, Air, Water, Lightning, Earth, Life, Death) that modify recipes.

## Tech Stack

### Backend
- **Runtime**: Node.js >= 24.4.1
- **Framework**: Express.js (v4.18.2)
- **Language**: TypeScript (v5.9.2)
- **Database**: PostgreSQL 17.4 via Prisma ORM (v6.13.0)
- **Testing**: Vitest (v3.2.4) with supertest
- **Dev Tools**: tsx for dev execution, nodemon for hot reload

### Frontend
- **Framework**: Vue 3 (v3.5.18) with Composition API
- **State Management**: Pinia (v3.0.3)
- **Routing**: Vue Router (v4.5.1)
- **UI Library**: Naive UI (v2.42.0) with dark theme
- **Icons**: @vicons/ionicons5
- **HTTP Client**: Axios (v1.11.0)
- **Build Tool**: Vite (v6.3.5)
- **Testing**: Vitest + @testing-library/vue + @vue/test-utils

### Infrastructure
- **Package Manager**: pnpm (>= 9.0.0) with workspaces
- **Containerization**: Docker + Docker Compose
- **Linting**: ESLint (v9.33.0) with TypeScript and Vue plugins

## Project Structure

```
minerva/
├── packages/
│   ├── client/               # Vue 3 frontend
│   │   ├── src/
│   │   │   ├── components/   # Reusable Vue components
│   │   │   │   ├── ingredient/
│   │   │   │   ├── people/
│   │   │   │   ├── shared/   # Common components
│   │   │   │   └── spells/
│   │   │   ├── composables/  # Vue composables (e.g., useToast)
│   │   │   ├── router/       # Vue Router configuration
│   │   │   ├── store/        # Pinia stores (one per resource)
│   │   │   ├── types/        # TypeScript type definitions
│   │   │   ├── views/        # Route view components
│   │   │   ├── App.vue       # Root component
│   │   │   └── index.ts      # Entry point
│   │   ├── test/             # Vitest tests
│   │   ├── public/           # Static assets
│   │   └── vite.config.ts
│   │
│   └── server/               # Express.js backend
│       ├── src/
│       │   ├── routes/       # API route handlers (organized by resource)
│       │   │   ├── ingredients/
│       │   │   ├── inventory/
│       │   │   ├── items/
│       │   │   ├── people/
│       │   │   ├── potions/
│       │   │   ├── recipes/
│       │   │   ├── scheduler/
│       │   │   ├── skills/
│       │   │   ├── spells/
│       │   │   └── index.ts  # Route aggregator
│       │   └── utils/        # Utility functions
│       ├── prisma/
│       │   ├── schema.prisma # Database schema
│       │   ├── migrations/   # Database migrations
│       │   └── seed.ts       # Seed data
│       ├── test/             # Vitest tests
│       ├── index.ts          # Express server entry
│       └── vitest.config.ts
│
├── dist/                     # Production build output
├── docker-compose.yml        # Docker orchestration
├── Dockerfile                # Multi-stage Docker build
├── eslint.config.mjs         # Shared ESLint config
├── tsconfig.json             # Root TypeScript config
├── tsconfig.build.json       # Build-specific TypeScript config
└── pnpm-workspace.yaml       # pnpm workspace config
```

## Database Schema

### Core Models

**Recipe**: Potion recipes with ingredient requirements
- Fields: name, description, cauldronName
- Crystal Cauldron essences: fireEssence, airEssence, waterEssence, lightningEssence, earthEssence, lifeEssence, deathEssence
- Relations: ingredients (many-to-many via RecipeIngredient)

**Ingredient**: Raw materials for potions
- Fields: name, description, secured (boolean)
- Relations: recipes (many-to-many), inventoryItems (one-to-many)

**Potion**: Crafted potions with quality
- Fields: quality (NORMAL/HQ/LQ), recipeId
- Relations: inventoryItems (one-to-many)

**RecipeIngredient**: Join table for Recipe-Ingredient
- Fields: recipeId, ingredientId, quantity

### Inventory Models

**InventoryItem**: Ingredient inventory
- Fields: ingredientId, quality (NORMAL/HQ/LQ), quantity

**PotionInventoryItem**: Potion inventory
- Fields: potionId, quantity

**ItemInventoryItem**: General item inventory
- Fields: itemId, quantity

**Item**: Generic items (non-potions, non-ingredients)
- Fields: name, description

### Scheduler Models

**WeekSchedule**: Weekly schedule container
- Fields: weekStartDate, totalScheduledUnits, freeTimeUsed
- Relations: days (one-to-many)

**DaySchedule**: Daily schedule
- Fields: day (0-6), dayName, totalUnits, weekScheduleId
- Relations: tasks (one-to-many)

**ScheduledTask**: Individual scheduled task
- Fields: type (TaskType enum), timeUnits, day, timeSlot (MORNING/AFTERNOON/EVENING), notes, details (JSON)
- Unique constraint: dayScheduleId + timeSlot

**TaskDefinition**: Task type definitions
- Fields: type (TaskType enum), name, timeUnits, color (hex), description, restrictions (JSON)
- TaskTypes: GATHER_INGREDIENT, BREWING, SECURE_INGREDIENTS, RESEARCH_RECIPES, RESEARCH_SPELL, FREE_TIME

### Other Models

**Person**: Character/NPC tracking
- Fields: name, description, relationship, notableEvents, url, isFavorited

**Skill**: Available skills
- Fields: name (unique)

**Spell**: Learnable spells with progression
- Fields: name (unique), currentStars, neededStars, isLearned

**Currency**: In-game currencies
- Fields: name (unique), value

## API Routes

All API routes are prefixed with `/api` and organized by resource:

### Ingredients (`/api/ingredients`)
- `GET /` - List all ingredients
- `POST /` - Create ingredient
- `GET /:id/deletable` - Check if ingredient can be deleted
- `PUT /:id` - Update ingredient
- `DELETE /:id` - Delete ingredient

### Recipes (`/api/recipes`)
- `GET /` - List all recipes
- `POST /` - Create recipe
- `PUT /:id` - Update recipe
- `DELETE /:id` - Delete recipe

### Inventory (`/api/inventory`)
- Separate sub-routers for ingredients, potions, and items
- Standard CRUD operations with quantity management

### Scheduler (`/api/scheduler`)
- Week and day schedule management
- Task definitions and scheduled tasks
- CRUD operations with cascading deletes

### People (`/api/people`)
- Character/NPC CRUD operations
- Favorite toggle functionality

### Spells (`/api/spells`) & Skills (`/api/skills`)
- Progression tracking
- Learning status management

**Route Pattern**: Each resource has its own directory with separate files:
- `index.ts` - Express router setup
- `get.ts` - GET operations
- `create.ts` - POST operations
- `update.ts` - PUT operations
- `delete.ts` - DELETE operations

## Client Architecture

### State Management (Pinia)

Each resource has a dedicated Pinia store in `packages/client/src/store/`:
- `ingredient.ts`
- `inventory.ts`
- `item.ts`
- `people.ts`
- `potion.ts`
- `recipe.ts`
- `scheduler.ts`
- `skills.ts`
- `spells.ts`

**Store Pattern**:
```typescript
export const useResourceStore = defineStore('resource', {
  state: (): ResourceStore => ({
    resources: []
  }),
  actions: {
    async getResources() { /* fetch from API */ },
    async addResource(data) { /* POST to API */ },
    async updateResource(id, data) { /* PUT to API */ },
    async deleteResource(id) { /* DELETE from API */ }
  }
})
```

### Routing

Vue Router with the following routes:
- `/` - Redirects to `/recipes`
- `/recipes` - Recipe management (default)
- `/ingredients` - Ingredient management
- `/inventory` - Inventory management
- `/scheduler` - Weekly schedule planner
- `/people` - Character/NPC tracker
- `/spells` - Spell progression
- `/skills` - Skill management

### Components

**Shared Components** (`packages/client/src/components/shared/`):
- Modals for creating/editing entities
- List components for displaying data
- Common UI elements

**Resource-Specific Components**:
- Organized by resource (ingredient/, people/, spells/)
- Specialized components for each domain

### UI/UX

- **Theme**: Dark theme using Naive UI's darkTheme
- **Layout**: Sticky header with navigation, content area below
- **Colors**: Dark background (#1a1a1a), lighter header (#2a2a2a)
- **Navigation**: Centered button group in header
- **Notifications**: Bottom-right placement using Naive UI's notification system

## Development Workflow

### Running the Application

**Full Stack (Docker)**:
```bash
pnpm dev          # Start all services (client, server, postgres)
```

**Individual Services**:
```bash
pnpm dev:client   # Vite dev server on port 5173 (mapped to 8080 in Docker)
pnpm dev:server   # Express server on port 3000
```

**Docker Services**:
- `client`: Vue app on port 8080 → localhost:5173
- `server`: Express API on port 3000
- `postgres`: Database on port 5432
- `postgres-test`: Test database on port 5433
- `prisma`: Utility container for Prisma commands (port 5555 for Studio)

### Database Management

**Prisma Commands** (from server package):
```bash
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma:migrate   # Run migrations
pnpm prisma:reset     # Reset database
pnpm prisma:studio    # Open Prisma Studio (port 5555)
```

**Environment Variable**:
```
MINERVA_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/minerva
```

### Testing

**Run All Tests**:
```bash
pnpm test         # Run tests in all packages
```

**Package-Specific**:
```bash
cd packages/client && pnpm test  # Frontend tests
cd packages/server && pnpm test  # Backend tests
```

### Quality Checks

```bash
pnpm lint         # ESLint all packages
pnpm tsc          # TypeScript check all packages
pnpm quality      # Run test + lint + tsc
```

### Building for Production

```bash
pnpm build        # Clean, install, generate Prisma, build all packages
```

Production build:
- Frontend: Static files in `dist/client/`
- Backend: Compiled JS in `dist/server/`
- Server serves client static files in production mode

## Key Patterns and Conventions

### Code Style (ESLint)

- **Indentation**: 2 spaces
- **Semicolons**: Never
- **Quotes**: Single quotes
- **Files**: `.ts`, `.vue`, `.d.ts`, `.js`, `.mjs`, `.cjs`

### TypeScript

- **Strict mode**: Enabled
- **Type definitions**: Centralized in `types/` directories
- **Prisma types**: Generated to `prisma-types.d.ts` in both packages
- **Path aliases**: `#/` for type imports

### API Design

- **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Error Handling**:
  - Specific error codes (e.g., `INGREDIENT_IN_USE`, `INGREDIENT_IN_INVENTORY`)
  - Proper HTTP status codes
  - Error messages in response body
- **ID Parsing**: Utility function `parseId` for validating route parameters

### Vue Patterns

- **Composition API**: `<script lang="ts" setup>` syntax
- **Component Registration**: Automatic via Vite
- **Props/Emits**: TypeScript interfaces for type safety
- **State**: Pinia stores for global state, reactive refs for local state

### Testing Patterns

- **Unit Tests**: Component and store testing with Vue Test Utils
- **Integration Tests**: API endpoint testing with supertest
- **Setup**: Global test setup in `test/setup.ts`
- **Coverage**: Tests mirror source structure

## Useful Commands Reference

### Development
```bash
pnpm dev              # Start full stack in Docker
pnpm dev:client       # Frontend only (Vite)
pnpm dev:server       # Backend only (tsx + nodemon)
```

### Database
```bash
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma:migrate   # Create and run migrations
pnpm prisma:reset     # Reset and reseed database
pnpm prisma:studio    # Open Prisma Studio UI
```

### Quality
```bash
pnpm test            # Run all tests
pnpm lint            # Lint all code
pnpm tsc             # Type check
pnpm quality         # All quality checks
```

### Build
```bash
pnpm build           # Production build
pnpm clean           # Remove dist and node_modules
```

### Docker
```bash
docker compose up --build          # Build and start all services
docker compose down                # Stop all services
docker compose exec server sh      # Shell into server container
docker compose exec prisma sh      # Shell into prisma container
docker compose logs -f server      # Follow server logs
```

## Important Notes

### Port Mappings
- Frontend (dev): http://localhost:8080 (Docker) or http://localhost:5173 (local)
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432
- PostgreSQL Test: localhost:5433
- Prisma Studio: localhost:5555

### Environment Variables
- `MINERVA_DATABASE_URL`: PostgreSQL connection string
- `VITE_API_BASE`: API base path for frontend (`/api`)
- `NODE_ENV`: Set to `production` for production builds

### Data Relationships
- Ingredients can be "secured" (boolean flag)
- Recipes can have Crystal Cauldron essences (7 types)
- Quality tiers: NORMAL, HQ (High Quality), LQ (Low Quality)
- Scheduled tasks have time slots: MORNING, AFTERNOON, EVENING
- Week schedules start on specific dates and track total time units

### Testing Strategy
- Unit tests for components, stores, and utilities
- Integration tests for API routes and complex workflows
- Tests use a separate PostgreSQL database (postgres-test)
- Setup/teardown handled in test/setup.ts files

## Common Development Tasks

### Adding a New Resource

1. **Database**: Add model to `schema.prisma`, create migration
2. **Backend**:
   - Create route directory in `src/routes/`
   - Add CRUD operations (get.ts, create.ts, update.ts, delete.ts)
   - Export router in index.ts
   - Register router in `src/routes/index.ts`
3. **Frontend**:
   - Create Pinia store in `src/store/`
   - Create types in `src/types/store/`
   - Create components in `src/components/`
   - Create view in `src/views/`
   - Add route to `src/router/index.ts`
   - Add navigation button to `App.vue`
4. **Tests**: Add tests mirroring the structure

### Modifying the Database Schema

1. Edit `packages/server/prisma/schema.prisma`
2. Run `pnpm prisma:migrate` (creates migration and applies it)
3. Update TypeScript types if needed
4. Regenerate Prisma Client: `pnpm prisma:generate`

### Debugging

- **Server logs**: Check `packages/server/server.log` or Docker logs
- **Database inspection**: Use Prisma Studio (`pnpm prisma:studio`)
- **Frontend**: Vue DevTools browser extension
- **API testing**: Use Prisma Studio, curl, or Postman against `http://localhost:3000/api`

## Architecture Decisions

1. **Monorepo**: pnpm workspaces for shared dependencies and coordinated versioning
2. **Type Safety**: Prisma generates types shared between frontend and backend
3. **Docker**: Ensures consistent development environment across machines
4. **Pinia over Vuex**: More TypeScript-friendly, simpler API
5. **Naive UI**: Comprehensive component library with built-in dark theme
6. **Route Organization**: Each resource gets its own directory with operation-specific files for maintainability
7. **JSON Fields**: Used for flexible data (task details, restrictions) without schema changes

## Future Considerations

- Authentication/authorization system
- Real-time updates (WebSockets)
- Data export/import functionality
- Advanced filtering and search
- Mobile responsive design improvements
- Accessibility enhancements
