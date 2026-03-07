import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { weekSchedule } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid scheduler ID' }
    }

    const [existing] = await db.select().from(weekSchedule).where(eq(weekSchedule.id, id))
    if (!existing) {
      setResponseStatus(event, 404)
      return { error: 'Scheduler not found' }
    }

    // Cascade deletes daySchedule and scheduledTask automatically
    await db.delete(weekSchedule).where(eq(weekSchedule.id, id))

    return { deletedWeeks: 1, message: 'Week deleted successfully' }
  } catch (error) {
    return handleUnknownError(event, 'deleting scheduler week', error)
  }
})
