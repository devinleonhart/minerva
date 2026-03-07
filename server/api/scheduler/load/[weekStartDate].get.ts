import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { taskDefinition } from '../../../db/index.js'
import { asc } from 'drizzle-orm'

// Convert PostgreSQL timestamp string to ISO format
function toISO(ts: string): string {
  return new Date(ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z').toISOString()
}

export default eventHandler(async (event) => {
  try {
    const raw = getRouterParam(event, 'weekStartDate')
    const weekStartDate = Array.isArray(raw) ? raw[0] : raw

    if (!weekStartDate || isNaN(Date.parse(weekStartDate))) {
      setResponseStatus(event, 400)
      return {
        error: 'Invalid week start date'
      }
    }

    const dateStr = new Date(weekStartDate).toISOString().split('T')[0]

    const weekScheduleRow = await db.query.weekSchedule.findFirst({
      where: (ws, { sql: sqlFn }) => sqlFn`DATE(${ws.weekStartDate}) = DATE(${dateStr})`,
      with: {
        days: {
          with: { tasks: true }
        }
      }
    })

    if (!weekScheduleRow) {
      return {
        currentWeek: null,
        taskDefinitions: []
      }
    }

    const currentWeek = {
      weekStartDate: toISO(weekScheduleRow.weekStartDate),
      totalScheduledUnits: weekScheduleRow.totalScheduledUnits,
      freeTimeUsed: weekScheduleRow.freeTimeUsed,
      days: weekScheduleRow.days.slice().sort((a, b) => a.day - b.day).map((day) => {
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

    const taskDefs = await db.select().from(taskDefinition).orderBy(asc(taskDefinition.type))

    return {
      currentWeek,
      taskDefinitions: taskDefs
    }
  } catch (error) {
    return handleUnknownError(event, 'loading scheduler', error)
  }
})
