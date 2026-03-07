import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { spell } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const id = parseId(getRouterParam(event, 'id'))
  if (id === null) {
    setResponseStatus(event, 400)
    return { error: 'Invalid spell ID' }
  }
  try {
    const [row] = await db.select().from(spell).where(eq(spell.id, id))
    if (!row) {
      setResponseStatus(event, 404)
      return { error: 'Spell not found' }
    }
    return row
  } catch (error) {
    return handleUnknownError(event, 'fetching spell', error)
  }
})
