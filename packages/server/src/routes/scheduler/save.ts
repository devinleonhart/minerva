import { Router, RequestHandler } from 'express'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { prisma } from '../../db.js'


const router: Router = Router()

const saveScheduler: RequestHandler = async (req, res) => {
  try {
    const { currentWeek, taskDefinitions } = req.body

    if (!currentWeek || !taskDefinitions) {
      res.status(400).json({
        error: 'Missing required fields: currentWeek and taskDefinitions'
      })
      return
    }

    const existingWeeks = await prisma.weekSchedule.findMany()
    let isUpdate = false
    let existingWeekId = null

    if (existingWeeks.length > 0) {
      const normalizedWeekStart = new Date(currentWeek.weekStartDate)
      normalizedWeekStart.setHours(0, 0, 0, 0)

      const existingWeek = existingWeeks.find((week: { weekStartDate: Date }) => {
        const existingStart = new Date(week.weekStartDate)
        existingStart.setHours(0, 0, 0, 0)
        return existingStart.getTime() === normalizedWeekStart.getTime()
      })

      if (existingWeek) {
        isUpdate = true
        existingWeekId = existingWeek.id
      } else {
        res.status(400).json({
          error: 'A week already exists. Please delete the current week first',
          existingWeekId: existingWeeks[0].id,
          existingWeekCount: existingWeeks.length
        })
        return
      }
    }

    const normalizedWeekStart = new Date(currentWeek.weekStartDate)
    normalizedWeekStart.setHours(0, 0, 0, 0)

    const result = await prisma.$transaction(async (tx) => {
      let weekSchedule

      if (isUpdate) {
        weekSchedule = await tx.weekSchedule.update({
          where: { id: existingWeekId! },
          data: {
            totalScheduledUnits: currentWeek.totalScheduledUnits,
            freeTimeUsed: currentWeek.freeTimeUsed,
            updatedAt: new Date()
          }
        })
      } else {
        weekSchedule = await tx.weekSchedule.create({
          data: {
            weekStartDate: normalizedWeekStart,
            totalScheduledUnits: currentWeek.totalScheduledUnits,
            freeTimeUsed: currentWeek.freeTimeUsed
          }
        })
      }

      await tx.scheduledTask.deleteMany({
        where: {
          daySchedule: {
            weekScheduleId: weekSchedule.id
          }
        }
      })

      await tx.daySchedule.deleteMany({
        where: {
          weekScheduleId: weekSchedule.id
        }
      })

      for (const day of currentWeek.days) {
        const daySchedule = await tx.daySchedule.create({
          data: {
            weekScheduleId: weekSchedule.id,
            day: day.day,
            dayName: day.dayName,
            totalUnits: day.totalUnits
          }
        })

        if (day.morning) {
          await tx.scheduledTask.create({
            data: {
              type: day.morning.type,
              timeUnits: day.morning.timeUnits,
              day: day.day,
              timeSlot: 'MORNING',
              notes: day.morning.notes || null,
              details: day.morning.details || null,
              dayScheduleId: daySchedule.id
            }
          })
        }

        if (day.afternoon) {
          await tx.scheduledTask.create({
            data: {
              type: day.afternoon.type,
              timeUnits: day.afternoon.timeUnits,
              day: day.day,
              timeSlot: 'AFTERNOON',
              notes: day.afternoon.notes || null,
              details: day.afternoon.details || null,
              dayScheduleId: daySchedule.id
            }
          })
        }

        if (day.evening) {
          await tx.scheduledTask.create({
            data: {
              type: day.evening.type,
              timeUnits: day.evening.timeUnits,
              day: day.day,
              timeSlot: 'EVENING',
              notes: day.evening.notes || null,
              details: day.evening.details || null,
              dayScheduleId: daySchedule.id
            }
          })
        }
      }

      for (const taskDef of taskDefinitions) {
        await tx.taskDefinition.upsert({
          where: { type: taskDef.type },
          update: {
            name: taskDef.name,
            timeUnits: taskDef.timeUnits,
            color: taskDef.color,
            description: taskDef.description,
            restrictions: taskDef.restrictions || null,
            updatedAt: new Date()
          },
          create: {
            type: taskDef.type,
            name: taskDef.name,
            timeUnits: taskDef.timeUnits,
            color: taskDef.color,
            description: taskDef.description,
            restrictions: taskDef.restrictions || null
          }
        })
      }

      return { weekSchedule }
    })

    res.json({
      success: true,
      message: 'Scheduler state saved successfully',
      savedAt: new Date().toISOString(),
      weekScheduleId: result.weekSchedule.id
    })
  } catch (error) {
    handleUnknownError(res, 'saving scheduler state', error)
  }
}

router.post('/', saveScheduler)

export default router
