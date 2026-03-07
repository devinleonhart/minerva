import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { item, itemInventoryItem } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid item ID' }
    }

    const existingInventoryItems = await db.select().from(itemInventoryItem).where(eq(itemInventoryItem.itemId, id))

    if (existingInventoryItems.length > 0) {
      setResponseStatus(event, 400)
      return {
        error: 'Cannot delete item that has inventory items',
        inventoryItemCount: existingInventoryItems.length
      }
    }

    const [row] = await db.delete(item).where(eq(item.id, id)).returning()
    if (!row) {
      setResponseStatus(event, 404)
      return { error: 'Item not found' }
    }

    setResponseStatus(event, 204)
    return null
  } catch (error) {
    return handleUnknownError(event, 'deleting item', error)
  }
})
