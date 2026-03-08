import { createApp, createRouter, toNodeListener } from 'h3'

// ── Skills ───────────────────────────────────────────────────────────────────
import skillsGetAll from '../api/skills/index.get.js'
import skillsGetById from '../api/skills/[id].get.js'
import skillsPost from '../api/skills/index.post.js'
import skillsDeleteById from '../api/skills/[id].delete.js'

// ── Spells ────────────────────────────────────────────────────────────────────
import spellsGetAll from '../api/spells/index.get.js'
import spellsGetById from '../api/spells/[id].get.js'
import spellsPost from '../api/spells/index.post.js'
import spellsPutById from '../api/spells/[id].put.js'
import spellsDeleteById from '../api/spells/[id].delete.js'
import spellsProgressById from '../api/spells/[id]/progress.patch.js'

// ── People ────────────────────────────────────────────────────────────────────
import peopleGetAll from '../api/people/index.get.js'
import peopleGetById from '../api/people/[id].get.js'
import peoplePost from '../api/people/index.post.js'
import peoplePutById from '../api/people/[id].put.js'
import peopleFavoriteById from '../api/people/[id]/favorite.patch.js'
import peopleDeleteById from '../api/people/[id].delete.js'

// ── Items ─────────────────────────────────────────────────────────────────────
import itemsGetAll from '../api/items/index.get.js'
import itemsGetById from '../api/items/[id].get.js'
import itemsPost from '../api/items/index.post.js'
import itemsPutById from '../api/items/[id].put.js'
import itemsDeleteById from '../api/items/[id].delete.js'

// ── Potions ───────────────────────────────────────────────────────────────────
import potionsGetAll from '../api/potions/index.get.js'
import potionsPost from '../api/potions/index.post.js'
import potionsDirect from '../api/potions/direct.post.js'

// ── Ingredients ───────────────────────────────────────────────────────────────
import ingredientsGetAll from '../api/ingredients/index.get.js'
import ingredientsPost from '../api/ingredients/index.post.js'
import ingredientsGetById from '../api/ingredients/[id].get.js'
import ingredientsPutById from '../api/ingredients/[id].put.js'
import ingredientsDeleteById from '../api/ingredients/[id].delete.js'
import ingredientsDeletable from '../api/ingredients/[id]/deletable.get.js'

// ── Inventory ─────────────────────────────────────────────────────────────────
import inventoryGetAll from '../api/inventory/index.get.js'
import inventoryPost from '../api/inventory/index.post.js'
import inventoryPutById from '../api/inventory/[id].put.js'
import inventoryDeleteById from '../api/inventory/[id].delete.js'
import inventoryCurrencyPost from '../api/inventory/currency/index.post.js'
import inventoryCurrencyPutById from '../api/inventory/currency/[id].put.js'
import inventoryCurrencyDeleteById from '../api/inventory/currency/[id].delete.js'
import inventoryItemPost from '../api/inventory/item/index.post.js'
import inventoryItemPutById from '../api/inventory/item/[id].put.js'
import inventoryItemDeleteById from '../api/inventory/item/[id].delete.js'
import inventoryPotionPutById from '../api/inventory/potion/[id].put.js'
import inventoryPotionDeleteById from '../api/inventory/potion/[id].delete.js'

// ── Recipes ───────────────────────────────────────────────────────────────────
import recipesGetAll from '../api/recipes/index.get.js'
import recipesPost from '../api/recipes/index.post.js'
import recipesCraftable from '../api/recipes/craftable.get.js'
import recipesGetById from '../api/recipes/[id].get.js'
import recipesPutById from '../api/recipes/[id].put.js'
import recipesDeleteById from '../api/recipes/[id].delete.js'
import recipesCraftableById from '../api/recipes/[id]/craftable.get.js'
import recipesDeletableById from '../api/recipes/[id]/deletable.get.js'

// ── Scheduler ─────────────────────────────────────────────────────────────────
import schedulerWeekGet from '../api/scheduler/week/index.get.js'
import schedulerWeekPost from '../api/scheduler/week/index.post.js'
import schedulerWeekDelete from '../api/scheduler/week/index.delete.js'
import schedulerTasksPost from '../api/scheduler/tasks/index.post.js'
import schedulerTasksPatch from '../api/scheduler/tasks/[id].patch.js'
import schedulerTasksDelete from '../api/scheduler/tasks/[id].delete.js'

export function createTestApp() {
  const app = createApp()
  const router = createRouter()

  // Skills
  router.get('/api/skills', skillsGetAll)
  router.get('/api/skills/:id', skillsGetById)
  router.post('/api/skills', skillsPost)
  router.delete('/api/skills/:id', skillsDeleteById)

  // Spells — static sub-paths before dynamic :id
  router.get('/api/spells', spellsGetAll)
  router.post('/api/spells', spellsPost)
  router.patch('/api/spells/:id/progress', spellsProgressById)
  router.get('/api/spells/:id', spellsGetById)
  router.put('/api/spells/:id', spellsPutById)
  router.delete('/api/spells/:id', spellsDeleteById)

  // People — static sub-paths before dynamic :id
  router.get('/api/people', peopleGetAll)
  router.post('/api/people', peoplePost)
  router.patch('/api/people/:id/favorite', peopleFavoriteById)
  router.get('/api/people/:id', peopleGetById)
  router.put('/api/people/:id', peoplePutById)
  router.delete('/api/people/:id', peopleDeleteById)

  // Items
  router.get('/api/items', itemsGetAll)
  router.post('/api/items', itemsPost)
  router.get('/api/items/:id', itemsGetById)
  router.put('/api/items/:id', itemsPutById)
  router.delete('/api/items/:id', itemsDeleteById)

  // Potions — static 'direct' before dynamic ':id' (not needed here but good habit)
  router.get('/api/potions', potionsGetAll)
  router.post('/api/potions/direct', potionsDirect)
  router.post('/api/potions', potionsPost)

  // Ingredients — static sub-paths registered before dynamic :id
  router.get('/api/ingredients', ingredientsGetAll)
  router.post('/api/ingredients', ingredientsPost)
  router.get('/api/ingredients/:id/deletable', ingredientsDeletable)
  router.get('/api/ingredients/:id', ingredientsGetById)
  router.put('/api/ingredients/:id', ingredientsPutById)
  router.delete('/api/ingredients/:id', ingredientsDeleteById)

  // Inventory — static sub-paths before generic :id
  router.get('/api/inventory', inventoryGetAll)
  router.post('/api/inventory', inventoryPost)
  router.post('/api/inventory/currency', inventoryCurrencyPost)
  router.put('/api/inventory/currency/:id', inventoryCurrencyPutById)
  router.delete('/api/inventory/currency/:id', inventoryCurrencyDeleteById)
  router.post('/api/inventory/item', inventoryItemPost)
  router.put('/api/inventory/item/:id', inventoryItemPutById)
  router.delete('/api/inventory/item/:id', inventoryItemDeleteById)
  router.put('/api/inventory/potion/:id', inventoryPotionPutById)
  router.delete('/api/inventory/potion/:id', inventoryPotionDeleteById)
  router.put('/api/inventory/:id', inventoryPutById)
  router.delete('/api/inventory/:id', inventoryDeleteById)

  // Recipes — static 'craftable' before dynamic :id
  router.get('/api/recipes', recipesGetAll)
  router.post('/api/recipes', recipesPost)
  router.get('/api/recipes/craftable', recipesCraftable)
  router.get('/api/recipes/:id/craftable', recipesCraftableById)
  router.get('/api/recipes/:id/deletable', recipesDeletableById)
  router.get('/api/recipes/:id', recipesGetById)
  router.put('/api/recipes/:id', recipesPutById)
  router.delete('/api/recipes/:id', recipesDeleteById)

  // Scheduler
  router.get('/api/scheduler/week', schedulerWeekGet)
  router.post('/api/scheduler/week', schedulerWeekPost)
  router.delete('/api/scheduler/week', schedulerWeekDelete)
  router.post('/api/scheduler/tasks', schedulerTasksPost)
  router.patch('/api/scheduler/tasks/:id', schedulerTasksPatch)
  router.delete('/api/scheduler/tasks/:id', schedulerTasksDelete)

  app.use(router)
  return toNodeListener(app)
}
