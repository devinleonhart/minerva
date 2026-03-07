import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { parseId } from '../../../utils/parseId.js'
import { potionInventoryItem } from '../../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))

    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid ID' }
    }

    await db.delete(potionInventoryItem).where(eq(potionInventoryItem.id, id))

    return { message: 'Potion removed from inventory' }
  } catch (error) {
    return handleUnknownError(event, 'deleting potion from inventory', error)
  }
})
