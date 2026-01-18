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

    // Validate quality
    if (quality !== undefined && (
      quality === null ||
      quality === '' ||
      typeof quality !== 'string' ||
      !['NORMAL', 'HQ', 'LQ'].includes(quality)
    )) {
      return res.status(400).json({ error: 'Invalid quality. Must be NORMAL, HQ, or LQ' })
    }

    if (!recipeId || !ingredientSelections || !Array.isArray(ingredientSelections)) {
      return res.status(400).json({ error: 'recipeId and ingredientSelections array are required' })
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
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Verify all required ingredients are provided
    if (ingredientSelections.length !== recipe.ingredients.length) {
      return res.status(400).json({ error: 'All recipe ingredients must be provided' })
    }

    // Verify ingredient selections match recipe requirements
    const recipeIngredientIds = recipe.ingredients.map((ri: { ingredientId: number }) => ri.ingredientId)
    const selectionIngredientIds = ingredientSelections.map((s: { ingredientId: number }) => s.ingredientId)

    if (!recipeIngredientIds.every((id: number) => selectionIngredientIds.includes(id))) {
      return res.status(400).json({ error: 'Ingredient selections must match recipe requirements' })
    }

    // Verify quantities match recipe requirements
    for (const selection of ingredientSelections) {
      const recipeIngredient = recipe.ingredients.find((ri: { ingredientId: number; quantity: number }) => ri.ingredientId === selection.ingredientId)
      if (!recipeIngredient || selection.quantity !== recipeIngredient.quantity) {
        return res.status(400).json({ error: 'Ingredient quantities must match recipe requirements' })
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
      return res.status(400).json({ error: 'One or more inventory items not found' })
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

      // Check if a potion with the same recipe and quality already exists
      const existingPotion = await tx.potion.findFirst({
        where: {
          recipeId: recipeId,
          quality: quality as 'NORMAL' | 'HQ' | 'LQ'
        },
        include: {
          inventoryItems: true
        }
      })

      if (existingPotion && existingPotion.inventoryItems.length > 0) {
        // Potion exists, increment its inventory quantity
        const inventoryItem = existingPotion.inventoryItems[0]
        await tx.potionInventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            quantity: inventoryItem.quantity + 1
          }
        })
        return existingPotion
      } else {
        // Create new potion
        const newPotion = await tx.potion.create({
          data: {
            quality: quality as 'NORMAL' | 'HQ' | 'LQ',
            recipeId: recipeId
          }
        })

        // Add potion to inventory
        await tx.potionInventoryItem.create({
          data: {
            potionId: newPotion.id,
            quantity: 1
          }
        })

        return newPotion
      }
    })

    // Fetch the created potion with recipe details
    const potionWithRecipe = await prisma.potion.findUnique({
      where: { id: potion.id }
    })

    if (!potionWithRecipe) {
      return res.status(500).json({ error: 'Failed to create potion' })
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

    return res.status(201).json(potionWithRecipeData)
  } catch (error) {
    handleUnknownError(res, 'crafting potion', error)
  }
})

export default router
