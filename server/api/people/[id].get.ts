import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { person } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid person ID' }
    }

    const [row] = await db.select().from(person).where(eq(person.id, id))
    if (!row) {
      setResponseStatus(event, 404)
      return { error: 'Person not found' }
    }

    return row
  } catch (error) {
    return handleUnknownError(event, 'fetching person', error)
  }
})
