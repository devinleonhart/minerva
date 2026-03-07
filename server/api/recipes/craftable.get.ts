import { eventHandler } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

export default eventHandler(async (event) => {
  try {
    // Get all recipes
    const recipes = await db.query.recipe.findMany({
      with: {
        ingredients: {
          with: { ingredient: true }
        }
      }
    })

    // Get all inventory items
    const inventoryItems = await db.query.inventoryItem.findMany({
      with: { ingredient: true }
    })

    // Group inventory by ingredient ID
    const inventoryByIngredient = new Map<number, number>()
    for (const invItem of inventoryItems) {
      const current = inventoryByIngredient.get(invItem.ingredientId) || 0
      inventoryByIngredient.set(invItem.ingredientId, current + invItem.quantity)
    }

    // Check which recipes are craftable and add canCraft property
    const recipesWithCraftability = recipes.map((recipeRow: { id: number; name: string; ingredients: Array<{ ingredientId: number; quantity: number }> }) => {
      const canCraft = recipeRow.ingredients.every(recipeIngredient => {
        const available = inventoryByIngredient.get(recipeIngredient.ingredientId) || 0
        return available >= recipeIngredient.quantity
      })

      return {
        ...recipeRow,
        canCraft
      }
    })

    // Filter to only return craftable recipes
    const craftableRecipes = recipesWithCraftability.filter((recipeRow: { canCraft: boolean }) => recipeRow.canCraft)

    return craftableRecipes
  } catch (error) {
    return handleUnknownError(event, 'fetching craftable recipes', error)
  }
})
