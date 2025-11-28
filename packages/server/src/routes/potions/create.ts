import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import type { PrismaClient } from '../../generated/client.js'

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>

const router: Router = Router()

interface CraftPotionRequest {
  recipeId: number
  quality?: string
  ingredientSelections: Array<{
    ingredientId: number
    inventoryItemId: number
    quantity: number
  }>
}

router.post('/', async (req, res) => {
  try {
    const { recipeId, quality = 'NORMAL', ingredientSelections } = req.body as CraftPotionRequest

    if (!recipeId || !ingredientSelections || !Array.isArray(ingredientSelections)) {
      res.status(400).json({ error: 'recipeId and ingredientSelections array are required' })
      return
    }

    // Verify recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
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

    // Verify all required ingredients are provided
    if (ingredientSelections.length !== recipe.ingredients.length) {
      res.status(400).json({ error: 'All recipe ingredients must be provided' })
      return
    }

    // Verify ingredient selections match recipe requirements
    const recipeIngredientIds = recipe.ingredients.map((ri: { ingredientId: number }) => ri.ingredientId)
    const selectionIngredientIds = ingredientSelections.map((s: { ingredientId: number }) => s.ingredientId)

    if (!recipeIngredientIds.every((id: number) => selectionIngredientIds.includes(id))) {
      res.status(400).json({ error: 'Ingredient selections must match recipe requirements' })
      return
    }

    // Verify quantities match recipe requirements
    for (const selection of ingredientSelections) {
      const recipeIngredient = recipe.ingredients.find((ri: { ingredientId: number; quantity: number }) => ri.ingredientId === selection.ingredientId)
      if (!recipeIngredient || selection.quantity !== recipeIngredient.quantity) {
        res.status(400).json({ error: 'Ingredient quantities must match recipe requirements' })
        return
      }
    }

    // Verify inventory items exist and have sufficient quantities
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        id: { in: ingredientSelections.map(s => s.inventoryItemId) }
      },
      include: {
        ingredient: true
      }
    })

    if (inventoryItems.length !== ingredientSelections.length) {
      res.status(400).json({ error: 'One or more inventory items not found' })
      return
    }

    // Verify sufficient quantities and update inventory
    const potion = await prisma.$transaction(async (tx: TransactionClient) => {
      for (const selection of ingredientSelections) {
        const inventoryItem = inventoryItems.find((item: { id: number }) => item.id === selection.inventoryItemId)
        if (!inventoryItem) {
          throw new Error('Inventory item not found')
        }

        if (inventoryItem.quantity < selection.quantity) {
          throw new Error(`Insufficient quantity for ${inventoryItem.ingredient.name}`)
        }

        // Update inventory quantity
        await tx.inventoryItem.update({
          where: { id: selection.inventoryItemId },
          data: {
            quantity: inventoryItem.quantity - selection.quantity
          }
        })

        // Remove inventory item if quantity becomes 0
        if (inventoryItem.quantity - selection.quantity === 0) {
          await tx.inventoryItem.delete({
            where: { id: selection.inventoryItemId }
          })
        }
      }

      // Create the potion
      const potion = await tx.potion.create({
        data: {
          quality: quality as 'NORMAL' | 'HQ' | 'LQ',
          recipeId: recipeId
        }
      })

      // Add potion to inventory
      await tx.potionInventoryItem.create({
        data: {
          potionId: potion.id,
          quantity: 1
        }
      })

      return potion
    })

    // Fetch the created potion with recipe details
    const potionWithRecipe = await prisma.potion.findUnique({
      where: { id: potion.id }
    })

    if (!potionWithRecipe) {
      res.status(500).json({ error: 'Failed to create potion' })
      return
    }

    // Fetch recipe information separately
    const recipeData = await prisma.recipe.findUnique({
      where: { id: potionWithRecipe.recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    })

    const potionWithRecipeData = {
      ...potionWithRecipe,
      recipe: recipeData
    }

    res.status(201).json(potionWithRecipeData)
  } catch (error) {
    handleUnknownError(res, 'crafting potion', error)
  }
})

export default router
