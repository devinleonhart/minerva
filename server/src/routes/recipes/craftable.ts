import { Router } from 'express'
import { db } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/craftable', async (req, res) => {
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
    for (const item of inventoryItems) {
      const current = inventoryByIngredient.get(item.ingredientId) || 0
      inventoryByIngredient.set(item.ingredientId, current + item.quantity)
    }

    // Check which recipes are craftable and add canCraft property
    const recipesWithCraftability = recipes.map((recipe: { id: number; name: string; ingredients: Array<{ ingredientId: number; quantity: number }> }) => {
      const canCraft = recipe.ingredients.every(recipeIngredient => {
        const available = inventoryByIngredient.get(recipeIngredient.ingredientId) || 0
        return available >= recipeIngredient.quantity
      })

      return {
        ...recipe,
        canCraft
      }
    })

    // Filter to only return craftable recipes
    const craftableRecipes = recipesWithCraftability.filter((recipe: { canCraft: boolean }) => recipe.canCraft)

    return res.json(craftableRecipes)
  } catch (error) {
    handleUnknownError(res, 'fetching craftable recipes', error)
  }
})

router.get('/:id/craftable', async (req, res) => {
  try {
    const id = parseId(req)

    if (id === null) {
      return res.status(400).json({ error: 'Invalid recipe ID' })
    }

    // Get recipe with ingredients
    const recipe = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      with: {
        ingredients: {
          with: { ingredient: true }
        }
      }
    })

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Get all available inventory items for the required ingredients
    const ingredientIds = (recipe.ingredients as Array<{ ingredientId: number }>).map((ri) => ri.ingredientId)
    const inventoryItems = await db.query.inventoryItem.findMany({
      where: (inv, { inArray }) => inArray(inv.ingredientId, ingredientIds),
      with: { ingredient: true },
      orderBy: (inv, { asc, desc }) => [asc(inv.quality), desc(inv.quantity)]
    })

    // Group inventory items by ingredient
    const inventoryByIngredient = new Map<number, Array<{
      id: number
      quality: string
      quantity: number
      totalAvailable: number
    }>>()

    for (const item of inventoryItems) {
      if (!inventoryByIngredient.has(item.ingredientId)) {
        inventoryByIngredient.set(item.ingredientId, [])
      }

      const existing = inventoryByIngredient.get(item.ingredientId)!
      const qualityGroup = existing.find(group => group.quality === item.quality)

      if (qualityGroup) {
        qualityGroup.totalAvailable += item.quantity
      } else {
        existing.push({
          id: item.id,
          quality: item.quality,
          quantity: item.quantity,
          totalAvailable: item.quantity
        })
      }
    }

    // Check craftability for each ingredient
    const craftability = (recipe.ingredients as Array<{ ingredientId: number; quantity: number; ingredient: { name: string } }>).map((recipeIngredient) => {
      const availableInventory = inventoryByIngredient.get(recipeIngredient.ingredientId) || []
      const totalAvailable = availableInventory.reduce((sum, item) => sum + item.totalAvailable, 0)
      const isCraftable = totalAvailable >= recipeIngredient.quantity

      return {
        ingredientId: recipeIngredient.ingredientId,
        ingredientName: recipeIngredient.ingredient.name,
        requiredQuantity: recipeIngredient.quantity,
        availableQuantity: totalAvailable,
        isCraftable,
        availableOptions: availableInventory.map(item => ({
          inventoryItemId: item.id,
          quality: item.quality,
          quantity: item.quantity,
          totalAvailable: item.totalAvailable
        }))
      }
    })

    const isRecipeCraftable = craftability.every((ing: { isCraftable: boolean }) => ing.isCraftable)

    return res.json({
      recipeId: id,
      recipeName: recipe.name,
      isCraftable: isRecipeCraftable,
      ingredients: craftability
    })
  } catch (error) {
    handleUnknownError(res, 'checking recipe craftability', error)
  }
})

export default router
