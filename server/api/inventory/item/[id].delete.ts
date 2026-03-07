import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { parseId } from '../../../utils/parseId.js'
import { itemInventoryItem } from '../../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))

    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid ID' }
    }

    await db.delete(itemInventoryItem).where(eq(itemInventoryItem.id, id))

    return { message: 'Item removed from inventory' }
  } catch (error) {
    return handleUnknownError(event, 'deleting item from inventory', error)
  }
})
