import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { ingredient, inventoryItem } from '../../db/index.js'
import { eq, and } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const body = await readBody<Record<string, unknown>>(event) ?? {}
    const { ingredientId, quantity = 1, quality = 'NORMAL' } = body

    if (!ingredientId) {
      setResponseStatus(event, 400)
      return { error: 'ingredientId is required' }
    }

    if (quality !== undefined && (
      quality === null ||
      quality === '' ||
      typeof quality !== 'string' ||
      !['NORMAL', 'HQ', 'LQ'].includes(quality)
    )) {
      setResponseStatus(event, 400)
      return { error: 'Invalid quality. Must be NORMAL, HQ, or LQ' }
    }

    if (quantity !== undefined && ((quantity as number) < 0 || !Number.isInteger(quantity))) {
      setResponseStatus(event, 400)
      return { error: 'Quantity must be a non-negative integer' }
    }

    const [ing] = await db.select().from(ingredient).where(eq(ingredient.id, ingredientId as number))
    if (!ing) {
      setResponseStatus(event, 404)
      return { error: 'Ingredient not found' }
    }

    const [existing] = await db.select().from(inventoryItem)
      .where(and(eq(inventoryItem.ingredientId, ingredientId as number), eq(inventoryItem.quality, quality as 'NORMAL' | 'HQ' | 'LQ')))

    if (existing) {
      const [updated] = await db.update(inventoryItem)
        .set({ quantity: existing.quantity + (quantity as number), updatedAt: new Date().toISOString() })
        .where(eq(inventoryItem.id, existing.id))
        .returning()
      return { ...updated!, ingredient: ing }
    }

    const [created] = await db.insert(inventoryItem).values({
      ingredientId: ingredientId as number,
      quantity: quantity as number,
      quality: quality as 'NORMAL' | 'HQ' | 'LQ',
      updatedAt: new Date().toISOString()
    }).returning()

    setResponseStatus(event, 201)
    return { ...created!, ingredient: ing }
  } catch (error) {
    return handleUnknownError(event, 'creating inventory item', error)
  }
})
