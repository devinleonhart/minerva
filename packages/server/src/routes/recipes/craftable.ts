import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

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
    const ingredientIds = recipe.ingredients.map(ri => ri.ingredientId)
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
    const craftability = recipe.ingredients.map(recipeIngredient => {
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

    const isRecipeCraftable = craftability.every(ing => ing.isCraftable)

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
