import { Router, RequestHandler } from 'express'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { prisma } from '../../db.js'


const router: Router = Router()

const deleteSchedulerById: RequestHandler = async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid scheduler ID' })
    }

    const existingWeek = await prisma.weekSchedule.findUnique({
      where: { id }
    })

    if (!existingWeek) {
      return res.status(404).json({ error: 'Scheduler not found' })
    }

    await prisma.weekSchedule.delete({
      where: { id }
    })

    res.status(200).json({ deletedWeeks: 1, message: 'Week deleted successfully' })
  } catch (error) {
    handleUnknownError(res, 'deleting scheduler week', error)
  }
}

const deleteAllScheduler: RequestHandler = async (req, res) => {
  try {
    const now = new Date()
    const currentWeekStart = new Date(now)
    const dayOfWeek = now.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    currentWeekStart.setDate(now.getDate() - daysToSubtract)
    currentWeekStart.setHours(0, 0, 0, 0)

    await prisma.$transaction(async (tx) => {
      const existingWeeks = await tx.weekSchedule.findMany()

      if (existingWeeks.length === 0) {
        return res.json({ deletedWeeks: 0, message: 'No weeks found to delete' })
      }

      await tx.weekSchedule.deleteMany()

      res.json({ deletedWeeks: existingWeeks.length, message: 'All weeks deleted successfully' })
    })
  } catch (error) {
    handleUnknownError(res, 'deleting scheduler week', error)
  }
}

router.delete('/:id', deleteSchedulerById)
router.delete('/', deleteAllScheduler)

export default router
