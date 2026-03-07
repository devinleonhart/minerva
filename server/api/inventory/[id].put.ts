import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { inventoryItem, ingredient } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid inventory item ID' }
    }

    const { quality, quantity } = await readBody<Record<string, unknown>>(event) ?? {}

    const [existing] = await db.select().from(inventoryItem).where(eq(inventoryItem.id, id))
    if (!existing) {
      setResponseStatus(event, 404)
      return { error: 'Inventory item not found' }
    }

    if (quality !== undefined) {
      if (typeof quality !== 'string' || !['NORMAL', 'HQ', 'LQ'].includes(quality)) {
        setResponseStatus(event, 400)
        return { error: 'Invalid quality. Must be NORMAL, HQ, or LQ' }
      }
    }

    if (quantity !== undefined && ((quantity as number) < 0 || !Number.isInteger(quantity))) {
      setResponseStatus(event, 400)
      return { error: 'Quantity must be a non-negative integer' }
    }

    const updateData: {
      quality?: 'NORMAL' | 'HQ' | 'LQ'
      quantity?: number
      updatedAt: string
    } = { updatedAt: new Date().toISOString() }

    if (quality !== undefined) updateData.quality = quality as 'NORMAL' | 'HQ' | 'LQ'
    if (quantity !== undefined) updateData.quantity = quantity as number

    const [updated] = await db.update(inventoryItem)
      .set(updateData)
      .where(eq(inventoryItem.id, id))
      .returning()

    const [ing] = await db.select().from(ingredient).where(eq(ingredient.id, updated!.ingredientId))

    return { ...updated!, ingredient: ing }
  } catch (error) {
    return handleUnknownError(event, 'updating inventory item', error)
  }
})
