import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { parseId } from '../../../utils/parseId.js'
import { currency } from '../../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid currency ID' }
    }

    const [deleted] = await db.delete(currency).where(eq(currency.id, id)).returning()

    if (!deleted) {
      setResponseStatus(event, 404)
      return { error: 'Currency not found' }
    }

    setResponseStatus(event, 204)
    return null
  } catch (error) {
    return handleUnknownError(event, 'deleting currency from inventory', error)
  }
})
