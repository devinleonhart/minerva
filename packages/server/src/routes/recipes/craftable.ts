import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/craftable', async (req, res) => {
  try {
    // Get all recipes
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    })

    // Get all inventory items
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        ingredient: true
      }
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

    res.json(craftableRecipes)
  } catch (error) {
    handleUnknownError(res, 'fetching craftable recipes', error)
  }
})

router.get('/:id/craftable', async (req, res) => {
  try {
    const id = parseId(req)

    if (id === null) {
      res.status(400).json({ error: 'Invalid ID' })
      return
    }

    // Get recipe with ingredients
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    })

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' })
      return
    }

    // Get all available inventory items for the required ingredients
    const ingredientIds = recipe.ingredients.map((ri: { ingredientId: number }) => ri.ingredientId)
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        ingredientId: { in: ingredientIds }
      },
      include: {
        ingredient: true
      },
      orderBy: [
        { quality: 'asc' }, // NORMAL first, then HQ, then LQ
        { quantity: 'desc' }
      ]
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
    const craftability = recipe.ingredients.map((recipeIngredient: { ingredientId: number; quantity: number; ingredient: { name: string } }) => {
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

    res.json({
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
