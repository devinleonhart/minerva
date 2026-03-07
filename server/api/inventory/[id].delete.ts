import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { inventoryItem } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid inventory item ID' }
    }

    const [existing] = await db.select().from(inventoryItem).where(eq(inventoryItem.id, id))
    if (!existing) {
      setResponseStatus(event, 404)
      return { error: 'Inventory item not found' }
    }

    await db.delete(inventoryItem).where(eq(inventoryItem.id, id))

    setResponseStatus(event, 204)
    return null
  } catch (error) {
    return handleUnknownError(event, 'deleting inventory item', error)
  }
})
