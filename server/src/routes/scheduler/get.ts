import { Router, RequestHandler } from 'express'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { prisma } from '../../db.js'


const router: Router = Router()

const getScheduler: RequestHandler = async (req, res) => {
  try {
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (dbConnectionError) {
      console.error('Database connection failed:', dbConnectionError)
      res.status(500).json({
        error: 'Database connection failed',
        details: dbConnectionError instanceof Error ? dbConnectionError.message : 'Unknown error'
      })
      return
    }

    const now = new Date()
    const currentWeekStart = new Date(now)
    const dayOfWeek = now.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    currentWeekStart.setDate(now.getDate() - daysToSubtract)
    currentWeekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(currentWeekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    let weekSchedule
    try {
      weekSchedule = await prisma.weekSchedule.findUnique({
        where: { weekStartDate: currentWeekStart },
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
        const allWeeks = await prisma.weekSchedule.findMany({
          include: {
            days: {
              include: {
                tasks: true
              },
              orderBy: { day: 'asc' }
            }
          }
        })

        if (allWeeks.length > 0) {
          for (const week of allWeeks) {
            const weekStart = new Date(week.weekStartDate)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            weekEnd.setHours(23, 59, 59, 999)

            if (now >= weekStart && now <= weekEnd) {
              weekSchedule = week
              break
            }
          }
        }
      }
    } catch (dbError) {
      console.error('Database error when loading week schedule:', dbError)
      res.status(500).json({
        error: 'Database error when loading week schedule',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      })
      return
    }

    let currentWeek = null

    if (weekSchedule) {
      currentWeek = {
        id: `week-${weekSchedule.id}`,
        weekStartDate: weekSchedule.weekStartDate.toISOString(),
        totalScheduledUnits: weekSchedule.totalScheduledUnits,
        freeTimeUsed: weekSchedule.freeTimeUsed,
        days: weekSchedule.days.map((day: { day: number; dayName: string; totalUnits: number; tasks: Array<{ timeSlot: string; id: number; type: string; timeUnits: number; notes: string | null; details: unknown }> }) => {
          const morning = day.tasks.find((task: { timeSlot: string; id: number; type: string; timeUnits: number; notes: string | null; details: unknown }) => task.timeSlot === 'MORNING')
          const afternoon = day.tasks.find((task: { timeSlot: string; id: number; type: string; timeUnits: number; notes: string | null; details: unknown }) => task.timeSlot === 'AFTERNOON')
          const evening = day.tasks.find((task: { timeSlot: string; id: number; type: string; timeUnits: number; notes: string | null; details: unknown }) => task.timeSlot === 'EVENING')

          return {
            day: day.day,
            dayName: day.dayName,
            totalUnits: day.totalUnits,
            morning: morning ? {
              id: `task-${morning.id}`,
              type: morning.type,
              timeUnits: morning.timeUnits,
              notes: morning.notes,
              details: morning.details
            } : null,
            afternoon: afternoon ? {
              id: `task-${afternoon.id}`,
              type: afternoon.type,
              timeUnits: afternoon.timeUnits,
              notes: afternoon.notes,
              details: afternoon.details
            } : null,
            evening: evening ? {
              id: `task-${evening.id}`,
              type: evening.type,
              timeUnits: evening.timeUnits,
              notes: evening.notes,
              details: evening.details
            } : null
          }
        })
      }
    }

    if (!weekSchedule) {
      return res.json({
        currentWeek: null,
        taskDefinitions: []
      })
    }

    let taskDefinitions: Awaited<ReturnType<typeof prisma.taskDefinition.findMany>> = []
    try {
      taskDefinitions = await prisma.taskDefinition.findMany({
        orderBy: { type: 'asc' }
      })

      // Task definitions loaded
    } catch (dbError) {
      console.error('Database error when loading task definitions:', dbError)
      taskDefinitions = []
    }

    return res.json({
      currentWeek,
      taskDefinitions
    })
  } catch (error) {
    handleUnknownError(res, 'getting scheduler', error)
  }
}

router.get('/', getScheduler)

export default router
