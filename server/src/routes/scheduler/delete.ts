import { Router, RequestHandler } from 'express'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { db } from '../../db.js'
import { weekSchedule } from '../../../db/index.js'
import { eq } from 'drizzle-orm'

const router: Router = Router()

const deleteSchedulerById: RequestHandler = async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid scheduler ID' })
    }

    const [existing] = await db.select().from(weekSchedule).where(eq(weekSchedule.id, id))
    if (!existing) {
      return res.status(404).json({ error: 'Scheduler not found' })
    }

    // Cascade deletes daySchedule and scheduledTask automatically
    await db.delete(weekSchedule).where(eq(weekSchedule.id, id))

    return res.status(200).json({ deletedWeeks: 1, message: 'Week deleted successfully' })
  } catch (error) {
    handleUnknownError(res, 'deleting scheduler week', error)
  }
}

const deleteAllScheduler: RequestHandler = async (req, res) => {
  try {
    const allWeeks = await db.select().from(weekSchedule)

    if (allWeeks.length === 0) {
      return res.json({ deletedWeeks: 0, message: 'No weeks found to delete' })
    }

    await db.delete(weekSchedule)

    return res.json({ deletedWeeks: allWeeks.length, message: 'All weeks deleted successfully' })
  } catch (error) {
    handleUnknownError(res, 'deleting scheduler week', error)
  }
}

router.delete('/:id', deleteSchedulerById)
router.delete('/', deleteAllScheduler)

export default router
