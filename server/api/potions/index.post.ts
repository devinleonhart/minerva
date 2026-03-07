import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { potion, potionInventoryItem, inventoryItem, ingredient } from '../../db/index.js'
import { eq, inArray } from 'drizzle-orm'

interface CraftPotionRequest {
  recipeId: number
  quality?: string
  ingredientSelections: Array<{
    ingredientId: number
    inventoryItemId: number
    quantity: number
  }>
}

export default eventHandler(async (event) => {
  try {
    const { recipeId, quality = 'NORMAL', ingredientSelections } = (await readBody(event) ?? {}) as CraftPotionRequest

    if (quality !== undefined && (
      quality === null ||
      quality === '' ||
      typeof quality !== 'string' ||
      !['NORMAL', 'HQ', 'LQ'].includes(quality)
    )) {
      setResponseStatus(event, 400)
      return { error: 'Invalid quality. Must be NORMAL, HQ, or LQ' }
    }

    if (!recipeId || !ingredientSelections || !Array.isArray(ingredientSelections)) {
      setResponseStatus(event, 400)
      return { error: 'recipeId and ingredientSelections array are required' }
    }

    const recipe = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, recipeId),
      with: {
        ingredients: {
          with: { ingredient: true }
        }
      }
    })

    if (!recipe) {
      setResponseStatus(event, 404)
      return { error: 'Recipe not found' }
    }

    type RecipeIngredientRow = { ingredientId: number; quantity: number }
    const recipeIngredients = recipe.ingredients as RecipeIngredientRow[]

    if (ingredientSelections.length !== recipeIngredients.length) {
      setResponseStatus(event, 400)
      return { error: 'All recipe ingredients must be provided' }
    }

    const recipeIngredientIds = recipeIngredients.map((ri) => ri.ingredientId)
    const selectionIngredientIds = ingredientSelections.map((s: { ingredientId: number }) => s.ingredientId)

    if (!recipeIngredientIds.every((id: number) => selectionIngredientIds.includes(id))) {
      setResponseStatus(event, 400)
      return { error: 'Ingredient selections must match recipe requirements' }
    }

    for (const selection of ingredientSelections) {
      const recipeIngredient = recipeIngredients.find((ri) => ri.ingredientId === selection.ingredientId)
      if (!recipeIngredient || selection.quantity !== recipeIngredient.quantity) {
        setResponseStatus(event, 400)
        return { error: 'Ingredient quantities must match recipe requirements' }
      }
    }

    const invItems = await db.select().from(inventoryItem)
      .where(inArray(inventoryItem.id, ingredientSelections.map(s => s.inventoryItemId)))

    const invItemsWithIngredient = await Promise.all(
      invItems.map(async (inv) => {
        const [ing] = await db.select().from(ingredient).where(eq(ingredient.id, inv.ingredientId))
        return { ...inv, ingredient: ing }
      })
    )

    if (invItemsWithIngredient.length !== ingredientSelections.length) {
      setResponseStatus(event, 400)
      return { error: 'One or more inventory items not found' }
    }

    const resultPotion = await db.transaction(async (tx) => {
      for (const selection of ingredientSelections) {
        const invItem = invItemsWithIngredient.find((i) => i.id === selection.inventoryItemId)
        if (!invItem) {
          throw new Error('Inventory item not found')
        }

        if (invItem.quantity < selection.quantity) {
          throw new Error(`Insufficient quantity for ${invItem.ingredient!.name}`)
        }

        const newQty = invItem.quantity - selection.quantity

        if (newQty === 0) {
          await tx.delete(inventoryItem).where(eq(inventoryItem.id, selection.inventoryItemId))
        } else {
          await tx.update(inventoryItem).set({
            quantity: newQty,
            updatedAt: new Date().toISOString()
          }).where(eq(inventoryItem.id, selection.inventoryItemId))
        }
      }

      const existingPotion = await tx.query.potion.findFirst({
        where: (p, { eq, and }) => and(eq(p.recipeId, recipeId), eq(p.quality, quality as 'NORMAL' | 'HQ' | 'LQ')),
        with: { inventoryItems: true }
      })

      type PotionInvItem = { id: number; quantity: number }
      if (existingPotion && (existingPotion.inventoryItems as PotionInvItem[]).length > 0) {
        const invItem = (existingPotion.inventoryItems as PotionInvItem[])[0]!
        await tx.update(potionInventoryItem).set({
          quantity: invItem.quantity + 1,
          updatedAt: new Date().toISOString()
        }).where(eq(potionInventoryItem.id, invItem.id))
        return existingPotion
      } else {
        const [newPotion] = await tx.insert(potion).values({
          quality: quality as 'NORMAL' | 'HQ' | 'LQ',
          recipeId: recipeId,
          updatedAt: new Date().toISOString()
        }).returning()

        await tx.insert(potionInventoryItem).values({
          potionId: newPotion!.id,
          quantity: 1,
          updatedAt: new Date().toISOString()
        })

        return newPotion
      }
    })

    const potionRow = await db.query.potion.findFirst({
      where: (p, { eq }) => eq(p.id, resultPotion!.id)
    })

    if (!potionRow) {
      setResponseStatus(event, 500)
      return { error: 'Failed to create potion' }
    }

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

    setResponseStatus(event, 201)
    return potionWithRecipeData
  } catch (error) {
    return handleUnknownError(event, 'crafting potion', error)
  }
})
