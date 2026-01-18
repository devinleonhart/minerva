import { Router, RequestHandler } from 'express'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { prisma } from '../../db.js'


const router: Router = Router()

const loadScheduler: RequestHandler = async (req, res) => {
  try {
    const { weekStartDate } = req.params

    // Validate the date parameter
    if (!weekStartDate || isNaN(Date.parse(weekStartDate))) {
      return res.status(400).json({
        error: 'Invalid week start date'
      })
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
      return res.json({
        currentWeek: null,
        taskDefinitions: []
      })
    }

    // Transform the data to match the expected format
    const currentWeek = {
      weekStartDate: weekSchedule.weekStartDate.toISOString(),
      totalScheduledUnits: weekSchedule.totalScheduledUnits,
      freeTimeUsed: weekSchedule.freeTimeUsed,
      days: weekSchedule.days.map((day: { day: number; dayName: string; totalUnits: number; tasks: Array<{ timeSlot: string; id: number; type: string; timeUnits: number; notes: string | null }> }) => {
        const morning = day.tasks.find((task: { timeSlot: string; id: number; type: string; timeUnits: number; notes: string | null }) => task.timeSlot === 'MORNING')
        const afternoon = day.tasks.find((task: { timeSlot: string; id: number; type: string; timeUnits: number; notes: string | null }) => task.timeSlot === 'AFTERNOON')
        const evening = day.tasks.find((task: { timeSlot: string; id: number; type: string; timeUnits: number; notes: string | null }) => task.timeSlot === 'EVENING')

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

    return res.json({
      currentWeek,
      taskDefinitions
    })
  } catch (error) {
    handleUnknownError(res, 'loading scheduler', error)
  }
}

router.get('/:weekStartDate', loadScheduler)

export default router
