import { Router, RequestHandler } from 'express'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const router: Router = Router()

const cleanupScheduler: RequestHandler = async (req, res) => {
  try {
    const deletedTasks = await prisma.scheduledTask.deleteMany()

    const deletedDays = await prisma.daySchedule.deleteMany()

    const deletedWeeks = await prisma.weekSchedule.deleteMany()

    res.json({
      deletedTasks: deletedTasks.count,
      deletedDays: deletedDays.count,
      deletedWeeks: deletedWeeks.count,
      message: 'Scheduler cleaned up successfully'
    })
  } catch (error) {
    handleUnknownError(res, 'cleaning up scheduler', error)
  }
}

router.post('/', cleanupScheduler)

export default router
