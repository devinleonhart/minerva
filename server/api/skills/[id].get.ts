import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { skill } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid skill ID' }
    }

    const [row] = await db.select().from(skill).where(eq(skill.id, id))
    if (!row) {
      setResponseStatus(event, 404)
      return { error: 'Skill not found' }
    }

    return row
  } catch (error) {
    return handleUnknownError(event, 'fetching skill', error)
  }
})
