import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { parseId } from '../../../utils/parseId.js'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))

    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid recipe ID' }
    }

    // Get recipe with ingredients and cauldron variants
    const recipeRow = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      with: {
        ingredients: {
          with: { ingredient: true }
        },
        cauldronVariants: {
          with: { essenceIngredient: true }
        }
      }
    })

    if (!recipeRow) {
      setResponseStatus(event, 404)
      return { error: 'Recipe not found' }
    }

    // Get all available inventory items for the required ingredients
    const ingredientIds = (recipeRow.ingredients as Array<{ ingredientId: number }>).map((ri) => ri.ingredientId)
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

    for (const invItem of inventoryItems) {
      if (!inventoryByIngredient.has(invItem.ingredientId)) {
        inventoryByIngredient.set(invItem.ingredientId, [])
      }

      const existing = inventoryByIngredient.get(invItem.ingredientId)!
      const qualityGroup = existing.find(group => group.quality === invItem.quality)

      if (qualityGroup) {
        qualityGroup.totalAvailable += invItem.quantity
      } else {
        existing.push({
          id: invItem.id,
          quality: invItem.quality,
          quantity: invItem.quantity,
          totalAvailable: invItem.quantity
        })
      }
    }

    // Check craftability for each ingredient
    const craftability = (recipeRow.ingredients as Array<{ ingredientId: number; quantity: number; ingredient: { name: string } }>).map((recipeIngredient) => {
      const availableInventory = inventoryByIngredient.get(recipeIngredient.ingredientId) || []
      const totalAvailable = availableInventory.reduce((sum, invItem) => sum + invItem.totalAvailable, 0)
      const isCraftable = totalAvailable >= recipeIngredient.quantity

      return {
        ingredientId: recipeIngredient.ingredientId,
        ingredientName: recipeIngredient.ingredient.name,
        requiredQuantity: recipeIngredient.quantity,
        availableQuantity: totalAvailable,
        isCraftable,
        availableOptions: availableInventory.map(invItem => ({
          inventoryItemId: invItem.id,
          quality: invItem.quality,
          quantity: invItem.quantity,
          totalAvailable: invItem.totalAvailable
        }))
      }
    })

    const isRecipeCraftable = craftability.every((ing: { isCraftable: boolean }) => ing.isCraftable)

    // Check availability for each cauldron variant
    type CauldronVariantRow = { essenceType: string; variantName: string; essenceIngredientId: number; essenceIngredient: { id: number; name: string } }
    const cauldronVariants = await Promise.all(
      (recipeRow.cauldronVariants as CauldronVariantRow[]).map(async (variant) => {
        const essenceInventory = await db.query.inventoryItem.findMany({
          where: (inv, { eq }) => eq(inv.ingredientId, variant.essenceIngredientId)
        })
        const totalAvailable = essenceInventory.reduce((sum, inv) => sum + inv.quantity, 0)
        return {
          essenceType: variant.essenceType,
          variantName: variant.variantName,
          essenceIngredientId: variant.essenceIngredientId,
          essenceIngredientName: variant.essenceIngredient.name,
          essenceAvailable: totalAvailable,
          isAvailable: isRecipeCraftable && totalAvailable >= 1
        }
      })
    )

    return {
      recipeId: id,
      recipeName: recipeRow.name,
      isCraftable: isRecipeCraftable,
      ingredients: craftability,
      cauldronVariants
    }
  } catch (error) {
    return handleUnknownError(event, 'checking recipe craftability', error)
  }
})
