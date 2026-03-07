import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { ingredient } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid ingredient ID' }
    }

    // Check if ingredient is used in any recipes
    const recipeUsage = await db.query.recipeIngredient.findFirst({
      where: (ri, { eq }) => eq(ri.ingredientId, id)
    })

    if (recipeUsage) {
      setResponseStatus(event, 400)
      return {
        error: 'Cannot delete ingredient that is used in recipes',
        code: 'INGREDIENT_IN_USE'
      }
    }

    // Check if ingredient has any inventory items
    const inventoryUsage = await db.query.inventoryItem.findFirst({
      where: (inv, { eq }) => eq(inv.ingredientId, id)
    })

    if (inventoryUsage) {
      setResponseStatus(event, 400)
      return {
        error: 'Cannot delete ingredient that has inventory items',
        code: 'INGREDIENT_IN_INVENTORY'
      }
    }

    const [row] = await db.delete(ingredient).where(eq(ingredient.id, id)).returning()
    if (!row) {
      setResponseStatus(event, 404)
      return { error: 'Ingredient not found' }
    }

    setResponseStatus(event, 204)
    return null
  } catch (error) {
    return handleUnknownError(event, 'deleting ingredient', error)
  }
})
