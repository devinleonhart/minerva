# Frontend Patterns

## Stores

One Pinia store per domain in `app/stores/`. Stores call `axios` directly (not `useApi`).

After **every successful mutation**, re-fetch from the server — no optimistic updates:
```typescript
async createPerson(request: CreatePersonRequest) {
  await axios.post('/api/people/', request)
  await this.getPeople() // always refresh after mutation
}
```

New stores should use Composition API style (see `inventory.ts`). Older stores (e.g. `people.ts`) use Options API — both work.

## Pages

Each `app/pages/*.vue` owns state orchestration for its domain:
- `onMounted` → call store fetch
- `ref`s for dialog open/close and the selected item being edited
- Handler functions that call the store, show toasts, and manage dialog state

Typical edit flow:
```typescript
const showForm = ref(false)
const selectedItem = ref<Item | null>(null)

function handleEdit(item: Item) {
  selectedItem.value = item
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  selectedItem.value = null
}
```

## Component Imports

Components are **not** auto-imported — explicit imports are required everywhere:
```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PersonList, PersonForm } from '@/components/features/people'
import { PageLayout } from '@/components/layout'
```

Each `features/` subdomain has an `index.ts` barrel that re-exports its components. When adding a new feature component, export it from the barrel.

## Vue Template Gotchas

**No inline `if` in event handler attributes** — the Vue template compiler rejects them:
```html
<!-- WRONG — parse error at build/typecheck time -->
@update:open="if (!$event) selectedItem = null"

<!-- CORRECT — extract a named method -->
@update:open="closeForm"
```

**`@update:open` on dialogs** — always wire to a method or `emit('update:open', $event)`, never an inline conditional.

## useSearch

`useSearch` only handles `string | number` fields by default. For fields that are arrays of objects (e.g. `person.notableEvents: PersonNotableEvent[]`), pass a `customFilter`:

```typescript
const { searchQuery, filteredItems } = useSearch({
  items: people,
  searchFields: ['name', 'description'],
  customFilter: (person, query) =>
    person.name.toLowerCase().includes(query) ||
    person.notableEvents.some(e => e.description.toLowerCase().includes(query))
})
```

When `customFilter` is provided it **replaces** the default field search entirely — include all fields you want searchable.

## useConfirm

For destructive actions, always await confirmation:
```typescript
const confirm = useConfirm()

const confirmed = await confirm.confirm({
  title: 'Delete Person',
  message: 'Are you sure you want to delete this person?',
  confirmText: 'Delete',
  variant: 'destructive'
})
if (!confirmed) return
```

## useToast

```typescript
const toast = useToast()
toast.success('Person added successfully')
toast.error('Failed to add person')
```

## Feature Component Structure

Domain feature components live in `app/components/features/<domain>/`:
- A **List** component — receives data as props, emits action events (`edit`, `delete`, etc.)
- A **Form** component — a Dialog-based create/edit form, uses `v-model:open` pattern

List components do not call stores directly — they emit events that the page handles.
