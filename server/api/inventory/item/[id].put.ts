import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { itemInventoryItem, item } from '../../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const { quantity } = await readBody<Record<string, unknown>>(event) ?? {}

    if (quantity === undefined || quantity === null) {
      setResponseStatus(event, 400)
      return { error: 'quantity is required' }
    }

    if ((quantity as number) < 0 || !Number.isInteger(quantity)) {
      setResponseStatus(event, 400)
      return { error: 'quantity must be a non-negative integer' }
    }

    const parsedId = parseInt(idParam ?? '', 10)

    const [existing] = await db.select().from(itemInventoryItem)
      .where(eq(itemInventoryItem.id, parsedId))

    if (!existing) {
      setResponseStatus(event, 404)
      return { error: 'Item inventory item not found' }
    }

    const [updated] = await db.update(itemInventoryItem)
      .set({ quantity: quantity as number, updatedAt: new Date().toISOString() })
      .where(eq(itemInventoryItem.id, parsedId))
      .returning()

    const [itemRow] = await db.select().from(item).where(eq(item.id, updated!.itemId))

    return { ...updated!, item: itemRow }
  } catch (error) {
    return handleUnknownError(event, 'updating item quantity', error)
  }
})
