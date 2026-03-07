import { eventHandler, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { taskDefinition } from '../../db/index.js'
import { asc, sql } from 'drizzle-orm'

// Convert PostgreSQL timestamp string to ISO format
function toISO(ts: string): string {
  return new Date(ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z').toISOString()
}

export default eventHandler(async (event) => {
  try {
    try {
      await db.execute(sql`SELECT 1`)
    } catch (dbConnectionError) {
      console.error('Database connection failed:', dbConnectionError)
      setResponseStatus(event, 500)
      return {
        error: 'Database connection failed',
        details: dbConnectionError instanceof Error ? dbConnectionError.message : 'Unknown error'
      }
    }

    const now = new Date()
    const currentWeekStart = new Date(now)
    const dayOfWeek = now.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    currentWeekStart.setDate(now.getDate() - daysToSubtract)
    currentWeekStart.setHours(0, 0, 0, 0)

    const dateStr = currentWeekStart.toISOString().split('T')[0]

    let weekScheduleRow
    try {
      weekScheduleRow = await db.query.weekSchedule.findFirst({
        where: (ws, { sql: sqlFn }) => sqlFn`DATE(${ws.weekStartDate}) = DATE(${dateStr})`,
        with: {
          days: {
            with: { tasks: true }
          }
        }
      })

      if (!weekScheduleRow) {
        const allWeeks = await db.query.weekSchedule.findMany({
          with: {
            days: {
              with: { tasks: true }
            }
          }
        })

        for (const week of allWeeks) {
          const weekStart = new Date(toISO(week.weekStartDate))
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          weekEnd.setHours(23, 59, 59, 999)

          if (now >= weekStart && now <= weekEnd) {
            weekScheduleRow = week
            break
          }
        }
      }
    } catch (dbError) {
      console.error('Database error when loading week schedule:', dbError)
      setResponseStatus(event, 500)
      return {
        error: 'Database error when loading week schedule',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }
    }

    let currentWeek = null

    if (weekScheduleRow) {
      currentWeek = {
        id: `week-${weekScheduleRow.id}`,
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

    if (!weekScheduleRow) {
      return {
        currentWeek: null,
        taskDefinitions: []
      }
    }

    let taskDefs: typeof taskDefinition.$inferSelect[] = []
    try {
      taskDefs = await db.select().from(taskDefinition).orderBy(asc(taskDefinition.type))
    } catch (dbError) {
      console.error('Database error when loading task definitions:', dbError)
      taskDefs = []
    }

    return {
      currentWeek,
      taskDefinitions: taskDefs
    }
  } catch (error) {
    return handleUnknownError(event, 'getting scheduler', error)
  }
})
