import { eventHandler } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { scheduledTask, daySchedule, weekSchedule } from '../../db/index.js'

export default eventHandler(async (event) => {
  try {
    const tasks = await db.select().from(scheduledTask)
    const days = await db.select().from(daySchedule)
    const weeks = await db.select().from(weekSchedule)

    await db.delete(scheduledTask)
    await db.delete(daySchedule)
    await db.delete(weekSchedule)

    return {
      deletedTasks: tasks.length,
      deletedDays: days.length,
      deletedWeeks: weeks.length,
      message: 'Scheduler cleaned up successfully'
    }
  } catch (error) {
    return handleUnknownError(event, 'cleaning up scheduler', error)
  }
})
