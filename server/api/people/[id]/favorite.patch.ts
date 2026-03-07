import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { parseId } from '../../../utils/parseId.js'
import { person } from '../../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const id = parseId(getRouterParam(event, 'id'))
  if (id === null) {
    setResponseStatus(event, 400)
    return { error: 'Invalid person ID' }
  }
  try {
    const [existing] = await db.select().from(person).where(eq(person.id, id))
    if (!existing) {
      setResponseStatus(event, 404)
      return { error: 'Person not found' }
    }
    const [row] = await db.update(person)
      .set({ isFavorited: !existing.isFavorited, updatedAt: new Date().toISOString() })
      .where(eq(person.id, id))
      .returning()
    return row
  } catch (error) {
    return handleUnknownError(event, 'toggling person favorite', error)
  }
})
