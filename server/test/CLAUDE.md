# Server Tests

Tests use Vitest + Supertest. All tests live in `server/test/routes/` (one file per resource) and run **sequentially** against a real test DB on port 5433.

## Adding Routes

Every new API route must be manually registered in `helpers.ts` — it is not automatic. Steps:

1. Import the handler at the top of `helpers.ts`
2. Register it in `createTestApp()` with `router.method('/api/path', handler)`
3. Register **static sub-paths before dynamic `:id`**:

```typescript
// CORRECT — static 'progress' registered before dynamic ':id'
router.patch('/api/spells/:id/progress', spellsProgressById)
router.get('/api/spells/:id', spellsGetById)

// WRONG — ':id' would swallow 'progress' as an id value
router.get('/api/spells/:id', spellsGetById)
router.patch('/api/spells/:id/progress', spellsProgressById)
```

## Test Helper Functions (setup.ts)

`createTestPerson`, `createTestIngredient`, `createTestItem`, etc. — one per entity, returns the inserted row (`T | undefined` due to `noUncheckedIndexedAccess`). Always use `person!.id`.

For entities with child rows, the helper inserts children separately:
```typescript
const person = await createTestPerson({
  name: 'Test',
  notableEvents: ['Event one', 'Event two'] // inserted into PersonNotableEvent
})
// person is the Person row only
```

When adding a new entity, add a `createTest*` helper to `setup.ts` and add its table to `cleanDatabase()`.

`cleanDatabase()` runs `beforeAll` and `beforeEach` — clears all tables in dependency order and resets sequences to 1. When adding a new table, add it in the correct FK order (children before parents).

## Writing a Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testDb, createTestFoo } from '../setup.js'
import { eq } from 'drizzle-orm'
import * as tables from '../../db/index.js'

const app = createTestApp()

describe('Foo Routes', () => {
  describe('POST /api/foo', () => {
    it('should create a foo', async () => {
      const response = await request(app)
        .post('/api/foo')
        .send({ name: 'Test Foo' })
        .expect(201)

      expect(response.body.name).toBe('Test Foo')

      // Verify in DB
      const [row] = await testDb.select().from(tables.foo).where(eq(tables.foo.id, response.body.id))
      expect(row).toBeTruthy()
    })
  })

  describe('GET /api/foo/:id', () => {
    it('should return foo by ID', async () => {
      const foo = await createTestFoo({ name: 'Test' })

      const response = await request(app)
        .get(`/api/foo/${foo!.id}`)
        .expect(200)

      expect(response.body.name).toBe('Test')
    })
  })
})
```

## Coverage

70% coverage threshold is enforced. Run `pnpm test:server:coverage` to check. Each new route file should have a corresponding test file in `server/test/routes/`.
