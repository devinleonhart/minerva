import { eventHandler } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { weekSchedule } from '../../db/index.js'

export default eventHandler(async (event) => {
  try {
    const allWeeks = await db.select().from(weekSchedule)

    if (allWeeks.length === 0) {
      return { deletedWeeks: 0, message: 'No weeks found to delete' }
    }

    await db.delete(weekSchedule)

    return { deletedWeeks: allWeeks.length, message: 'All weeks deleted successfully' }
  } catch (error) {
    return handleUnknownError(event, 'deleting scheduler week', error)
  }
})
