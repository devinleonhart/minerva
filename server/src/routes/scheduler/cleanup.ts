import { Router, RequestHandler } from 'express'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { db } from '../../db.js'
import { scheduledTask, daySchedule, weekSchedule } from '../../../db/index.js'

const router: Router = Router()

const cleanupScheduler: RequestHandler = async (req, res) => {
  try {
    const tasks = await db.select().from(scheduledTask)
    const days = await db.select().from(daySchedule)
    const weeks = await db.select().from(weekSchedule)

    await db.delete(scheduledTask)
    await db.delete(daySchedule)
    await db.delete(weekSchedule)

    return res.json({
      deletedTasks: tasks.length,
      deletedDays: days.length,
      deletedWeeks: weeks.length,
      message: 'Scheduler cleaned up successfully'
    })
  } catch (error) {
    handleUnknownError(res, 'cleaning up scheduler', error)
  }
}

router.post('/', cleanupScheduler)

export default router
