import { Router, RequestHandler } from 'express'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const router: Router = Router()

const loadScheduler: RequestHandler = async (req, res) => {
  try {
    const { weekStartDate } = req.params

    // Validate the date parameter
    if (!weekStartDate || isNaN(Date.parse(weekStartDate))) {
      res.status(400).json({
        error: 'Invalid week start date'
      })
      return
    }

    // Load from database
    const weekSchedule = await prisma.weekSchedule.findUnique({
      where: { weekStartDate: new Date(weekStartDate) },
      include: {
        days: {
          include: {
            tasks: true
          },
          orderBy: { day: 'asc' }
        }
      }
    })

    if (!weekSchedule) {
      res.json({
        currentWeek: null,
        taskDefinitions: []
      })
      return
    }

    // Transform the data to match the expected format
    const currentWeek = {
      weekStartDate: weekSchedule.weekStartDate.toISOString(),
      totalScheduledUnits: weekSchedule.totalScheduledUnits,
      freeTimeUsed: weekSchedule.freeTimeUsed,
      days: weekSchedule.days.map((day) => {
        const morning = day.tasks.find((task) => task.timeSlot === 'MORNING')
        const afternoon = day.tasks.find((task) => task.timeSlot === 'AFTERNOON')
        const evening = day.tasks.find((task) => task.timeSlot === 'EVENING')

        return {
          day: day.day,
          dayName: day.dayName,
          totalUnits: day.totalUnits,
          morning: morning ? {
            id: `task-${morning.id}`,
            type: morning.type,
            timeUnits: morning.timeUnits,
            notes: morning.notes,
            details: morning.notes
          } : null,
          afternoon: afternoon ? {
            id: `task-${afternoon.id}`,
            type: afternoon.type,
            timeUnits: afternoon.timeUnits,
            notes: afternoon.notes,
            details: afternoon.notes
          } : null,
          evening: evening ? {
            id: `task-${evening.id}`,
            type: evening.type,
            timeUnits: evening.timeUnits,
            notes: evening.notes,
            details: evening.notes
          } : null
        }
      })
    }

    // Load task definitions
    const taskDefinitions = await prisma.taskDefinition.findMany({
      orderBy: { type: 'asc' }
    })

    res.json({
      currentWeek,
      taskDefinitions
    })
  } catch (error) {
    handleUnknownError(res, 'loading scheduler', error)
  }
}

router.get('/:weekStartDate', loadScheduler)

export default router
