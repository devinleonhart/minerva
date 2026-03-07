import { eventHandler, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { weekSchedule } from '../../../db/index.js'
import { desc, eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const [latest] = await db.select()
      .from(weekSchedule)
      .orderBy(desc(weekSchedule.weekStartDate))
      .limit(1)

    if (!latest) {
      setResponseStatus(event, 404)
      return { error: 'No week found to delete' }
    }

    await db.delete(weekSchedule).where(eq(weekSchedule.id, latest.id))

    return { success: true }
  } catch (error) {
    return handleUnknownError(event, 'deleting scheduler week', error)
  }
})
