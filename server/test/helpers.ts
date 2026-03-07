import { createApp } from 'h3'
import { toNodeHandler } from 'h3/node'

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
import schedulerGetAll from '../api/scheduler/index.get.js'
import schedulerDeleteAll from '../api/scheduler/index.delete.js'
import schedulerDeleteById from '../api/scheduler/[id].delete.js'
import schedulerSave from '../api/scheduler/save.post.js'
import schedulerCleanup from '../api/scheduler/cleanup.post.js'
import schedulerLoad from '../api/scheduler/load/[weekStartDate].get.js'

export function createTestApp() {
  const app = createApp()

  // Skills
  app.on('GET', '/api/skills', skillsGetAll)
  app.on('GET', '/api/skills/:id', skillsGetById)
  app.on('POST', '/api/skills', skillsPost)
  app.on('DELETE', '/api/skills/:id', skillsDeleteById)

  // Spells — static sub-paths before dynamic :id
  app.on('GET', '/api/spells', spellsGetAll)
  app.on('POST', '/api/spells', spellsPost)
  app.on('PATCH', '/api/spells/:id/progress', spellsProgressById)
  app.on('GET', '/api/spells/:id', spellsGetById)
  app.on('PUT', '/api/spells/:id', spellsPutById)
  app.on('DELETE', '/api/spells/:id', spellsDeleteById)

  // People — static sub-paths before dynamic :id
  app.on('GET', '/api/people', peopleGetAll)
  app.on('POST', '/api/people', peoplePost)
  app.on('PATCH', '/api/people/:id/favorite', peopleFavoriteById)
  app.on('GET', '/api/people/:id', peopleGetById)
  app.on('PUT', '/api/people/:id', peoplePutById)
  app.on('DELETE', '/api/people/:id', peopleDeleteById)

  // Items
  app.on('GET', '/api/items', itemsGetAll)
  app.on('POST', '/api/items', itemsPost)
  app.on('GET', '/api/items/:id', itemsGetById)
  app.on('DELETE', '/api/items/:id', itemsDeleteById)

  // Potions — static 'direct' before dynamic ':id' (not needed here but good habit)
  app.on('GET', '/api/potions', potionsGetAll)
  app.on('POST', '/api/potions/direct', potionsDirect)
  app.on('POST', '/api/potions', potionsPost)

  // Ingredients — static sub-paths registered before dynamic :id
  app.on('GET', '/api/ingredients', ingredientsGetAll)
  app.on('POST', '/api/ingredients', ingredientsPost)
  app.on('GET', '/api/ingredients/:id/deletable', ingredientsDeletable)
  app.on('GET', '/api/ingredients/:id', ingredientsGetById)
  app.on('PUT', '/api/ingredients/:id', ingredientsPutById)
  app.on('DELETE', '/api/ingredients/:id', ingredientsDeleteById)

  // Inventory — static sub-paths before generic :id
  app.on('GET', '/api/inventory', inventoryGetAll)
  app.on('POST', '/api/inventory', inventoryPost)
  app.on('POST', '/api/inventory/currency', inventoryCurrencyPost)
  app.on('PUT', '/api/inventory/currency/:id', inventoryCurrencyPutById)
  app.on('DELETE', '/api/inventory/currency/:id', inventoryCurrencyDeleteById)
  app.on('POST', '/api/inventory/item', inventoryItemPost)
  app.on('PUT', '/api/inventory/item/:id', inventoryItemPutById)
  app.on('DELETE', '/api/inventory/item/:id', inventoryItemDeleteById)
  app.on('PUT', '/api/inventory/potion/:id', inventoryPotionPutById)
  app.on('DELETE', '/api/inventory/potion/:id', inventoryPotionDeleteById)
  app.on('PUT', '/api/inventory/:id', inventoryPutById)
  app.on('DELETE', '/api/inventory/:id', inventoryDeleteById)

  // Recipes — static 'craftable' before dynamic :id
  app.on('GET', '/api/recipes', recipesGetAll)
  app.on('POST', '/api/recipes', recipesPost)
  app.on('GET', '/api/recipes/craftable', recipesCraftable)
  app.on('GET', '/api/recipes/:id/craftable', recipesCraftableById)
  app.on('GET', '/api/recipes/:id/deletable', recipesDeletableById)
  app.on('GET', '/api/recipes/:id', recipesGetById)
  app.on('PUT', '/api/recipes/:id', recipesPutById)
  app.on('DELETE', '/api/recipes/:id', recipesDeleteById)

  // Scheduler — static sub-paths before dynamic :id
  app.on('GET', '/api/scheduler', schedulerGetAll)
  app.on('POST', '/api/scheduler/save', schedulerSave)
  app.on('POST', '/api/scheduler/cleanup', schedulerCleanup)
  app.on('GET', '/api/scheduler/load/:weekStartDate', schedulerLoad)
  app.on('DELETE', '/api/scheduler/:id', schedulerDeleteById)
  app.on('DELETE', '/api/scheduler', schedulerDeleteAll)

  return toNodeHandler(app)
}
