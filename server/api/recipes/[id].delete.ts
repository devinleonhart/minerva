import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { recipe, recipeIngredient } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))

    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid recipe ID' }
    }

    const existingRecipe = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, id)
    })

    if (!existingRecipe) {
      setResponseStatus(event, 404)
      return { error: 'Recipe not found' }
    }

    // Check if recipe has potions that are currently in inventory
    const potionsInInventory = await db.query.potionInventoryItem.findMany({
      with: { potion: true },
      where: (pii, { sql }) => sql`${pii.potionId} IN (SELECT id FROM "Potion" WHERE "recipeId" = ${id})`
    })

    if (potionsInInventory.length > 0) {
      setResponseStatus(event, 400)
      return { error: 'Cannot delete recipe because potions are in inventory' }
    }

    // Delete recipe with ingredients in a transaction
    await db.transaction(async (tx) => {
      // Delete recipe-ingredient relationships first
      await tx.delete(recipeIngredient).where(eq(recipeIngredient.recipeId, id))

      // Delete the recipe
      await tx.delete(recipe).where(eq(recipe.id, id))
    })

    setResponseStatus(event, 204)
    return null
  } catch (error) {
    return handleUnknownError(event, 'deleting recipe', error)
  }
})
