import { Router } from 'express'
import { db } from '../../db.js'
import { potion, potionInventoryItem, inventoryItem, ingredient } from '../../../db/index.js'
import { eq, inArray } from 'drizzle-orm'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

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
    const recipe = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, recipeId),
      with: {
        ingredients: {
          with: { ingredient: true }
        }
      }
    })

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    type RecipeIngredientRow = { ingredientId: number; quantity: number }
    const recipeIngredients = recipe.ingredients as RecipeIngredientRow[]

    // Verify all required ingredients are provided
    if (ingredientSelections.length !== recipeIngredients.length) {
      return res.status(400).json({ error: 'All recipe ingredients must be provided' })
    }

    // Verify ingredient selections match recipe requirements
    const recipeIngredientIds = recipeIngredients.map((ri) => ri.ingredientId)
    const selectionIngredientIds = ingredientSelections.map((s: { ingredientId: number }) => s.ingredientId)

    if (!recipeIngredientIds.every((id: number) => selectionIngredientIds.includes(id))) {
      return res.status(400).json({ error: 'Ingredient selections must match recipe requirements' })
    }

    // Verify quantities match recipe requirements
    for (const selection of ingredientSelections) {
      const recipeIngredient = recipeIngredients.find((ri) => ri.ingredientId === selection.ingredientId)
      if (!recipeIngredient || selection.quantity !== recipeIngredient.quantity) {
        return res.status(400).json({ error: 'Ingredient quantities must match recipe requirements' })
      }
    }

    // Verify inventory items exist and have sufficient quantities
    const invItems = await db.select().from(inventoryItem)
      .where(inArray(inventoryItem.id, ingredientSelections.map(s => s.inventoryItemId)))

    // Fetch ingredient info for error messages
    const invItemsWithIngredient = await Promise.all(
      invItems.map(async (inv) => {
        const [ing] = await db.select().from(ingredient).where(eq(ingredient.id, inv.ingredientId))
        return { ...inv, ingredient: ing }
      })
    )

    if (invItemsWithIngredient.length !== ingredientSelections.length) {
      return res.status(400).json({ error: 'One or more inventory items not found' })
    }

    // Verify sufficient quantities and update inventory
    const resultPotion = await db.transaction(async (tx) => {
      for (const selection of ingredientSelections) {
        const invItem = invItemsWithIngredient.find((item) => item.id === selection.inventoryItemId)
        if (!invItem) {
          throw new Error('Inventory item not found')
        }

        if (invItem.quantity < selection.quantity) {
          throw new Error(`Insufficient quantity for ${invItem.ingredient.name}`)
        }

        const newQty = invItem.quantity - selection.quantity

        if (newQty === 0) {
          // Remove inventory item if quantity becomes 0
          await tx.delete(inventoryItem).where(eq(inventoryItem.id, selection.inventoryItemId))
        } else {
          // Update inventory quantity
          await tx.update(inventoryItem).set({
            quantity: newQty,
            updatedAt: new Date().toISOString()
          }).where(eq(inventoryItem.id, selection.inventoryItemId))
        }
      }

      // Check if a potion with the same recipe and quality already exists
      const existingPotion = await tx.query.potion.findFirst({
        where: (p, { eq, and }) => and(eq(p.recipeId, recipeId), eq(p.quality, quality as 'NORMAL' | 'HQ' | 'LQ')),
        with: { inventoryItems: true }
      })

      type PotionInvItem = { id: number; quantity: number }
      if (existingPotion && (existingPotion.inventoryItems as PotionInvItem[]).length > 0) {
        // Potion exists, increment its inventory quantity
        const invItem = (existingPotion.inventoryItems as PotionInvItem[])[0]
        await tx.update(potionInventoryItem).set({
          quantity: invItem.quantity + 1,
          updatedAt: new Date().toISOString()
        }).where(eq(potionInventoryItem.id, invItem.id))
        return existingPotion
      } else {
        // Create new potion
        const [newPotion] = await tx.insert(potion).values({
          quality: quality as 'NORMAL' | 'HQ' | 'LQ',
          recipeId: recipeId,
          updatedAt: new Date().toISOString()
        }).returning()

        // Add potion to inventory
        await tx.insert(potionInventoryItem).values({
          potionId: newPotion.id,
          quantity: 1,
          updatedAt: new Date().toISOString()
        })

        return newPotion
      }
    })

    // Fetch the created potion
    const potionRow = await db.query.potion.findFirst({
      where: (p, { eq }) => eq(p.id, resultPotion.id)
    })

    if (!potionRow) {
      return res.status(500).json({ error: 'Failed to create potion' })
    }

    // Fetch recipe information separately
    const recipeData = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, potionRow.recipeId),
      with: {
        ingredients: {
          with: { ingredient: true }
        }
      }
    })

    const potionWithRecipeData = {
      ...potionRow,
      recipe: recipeData
    }

    return res.status(201).json(potionWithRecipeData)
  } catch (error) {
    handleUnknownError(res, 'crafting potion', error)
  }
})

export default router
