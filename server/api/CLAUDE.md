# API Route Handlers

## File Naming

One file per HTTP method, one directory per resource:
- `server/api/people/index.get.ts` → `GET /api/people`
- `server/api/people/index.post.ts` → `POST /api/people`
- `server/api/people/[id].put.ts` → `PUT /api/people/:id`
- `server/api/people/[id]/favorite.patch.ts` → `PATCH /api/people/:id/favorite`

## Route Handler Boilerplate

```typescript
import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { someTable } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid X ID' }
    }

    const body = await readBody<Record<string, unknown>>(event) ?? {}

    // ... validation and db ops ...

    setResponseStatus(event, 201) // only for successful POST creates
    return result
  } catch (error) {
    return handleUnknownError(event, 'doing X', error)
  }
})
```

## Rules

- `readBody<T>(event)` returns `Promise<T | undefined>` — **always** append `?? {}` or H3 will throw on empty body
- `parseId` rejects non-numeric, negative, zero, floats — returns `null`; check and return 400
- `handleUnknownError` sets 500 and returns `{ error: 'Internal server error' }`
- Every `insert` and `update` must include `updatedAt: new Date().toISOString()`
- HTTP status: 200 (default GET/PUT), 201 (POST creates), 204 (DELETE success), 400, 404, 500
- `noUncheckedIndexedAccess` is on: `const [row] = await db...returning()` → `row` is `T | undefined`

## Drizzle Patterns

### Query with relations
```typescript
return db.query.person.findFirst({
  where: (p, { eq }) => eq(p.id, id),
  with: { notableEvents: true }
})
```

### Insert + return
```typescript
const [row] = await db.insert(someTable).values({
  name: value,
  updatedAt: new Date().toISOString()
}).returning()
// row is T | undefined — check before use
```

### Update + 404 check
```typescript
const [row] = await db.update(someTable)
  .set({ field: value, updatedAt: new Date().toISOString() })
  .where(eq(someTable.id, id))
  .returning()
if (!row) {
  setResponseStatus(event, 404)
  return { error: 'X not found' }
}
```

### Delete + 204
```typescript
const [row] = await db.delete(someTable).where(eq(someTable.id, id)).returning()
if (!row) {
  setResponseStatus(event, 404)
  return { error: 'X not found' }
}
setResponseStatus(event, 204)
return null
```

### Deduplication (check-then-increment)
Used when adding to inventory — increment existing stack instead of creating a duplicate:
```typescript
const [existing] = await db.select().from(inventoryItem)
  .where(and(eq(inventoryItem.ingredientId, id), eq(inventoryItem.quality, quality)))
if (existing) {
  const [updated] = await db.update(inventoryItem)
    .set({ quantity: existing.quantity + amount, updatedAt: new Date().toISOString() })
    .where(eq(inventoryItem.id, existing.id))
    .returning()
  return updated
}
// else insert new row
```

### One-to-many child rows (delete + reinsert pattern)
Used when updating a parent with a variable-length child list (e.g., person → notableEvents):
```typescript
await db.delete(childTable).where(eq(childTable.parentId, parentId))
if (items.length > 0) {
  await db.insert(childTable).values(
    items.map(item => ({
      parentId,
      description: item.trim(),
      updatedAt: new Date().toISOString()
    }))
  )
}
```

### Transaction
```typescript
const result = await db.transaction(async (tx) => {
  await tx.update(...)
  await tx.insert(...)
  return tx.query.someTable.findFirst(...)
})
```
