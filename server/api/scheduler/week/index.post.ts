import { eventHandler, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { weekSchedule, daySchedule } from '../../../db/index.js'
import { formatWeek } from '../../../utils/schedulerWeek.js'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default eventHandler(async (event) => {
  try {
    const existing = await db.query.weekSchedule.findFirst()
    if (existing) {
      setResponseStatus(event, 409)
      return { error: 'A week already exists. Delete it first.' }
    }

    const now = new Date()
    const dow = now.getDay()
    const daysToSubtract = dow === 0 ? 6 : dow - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - daysToSubtract)
    monday.setHours(0, 0, 0, 0)

    const weekRow = await db.transaction(async (tx) => {
      const [created] = await tx.insert(weekSchedule).values({
        weekStartDate: monday.toISOString(),
        totalScheduledUnits: 0,
        freeTimeUsed: false,
        updatedAt: new Date().toISOString()
      }).returning()

      for (let i = 0; i < 7; i++) {
        await tx.insert(daySchedule).values({
          weekScheduleId: created!.id,
          day: i,
          dayName: DAY_NAMES[i]!,
          totalUnits: 0,
          updatedAt: new Date().toISOString()
        })
      }

      return created!
    })

    const fullWeek = await db.query.weekSchedule.findFirst({
      where: (ws, { eq: eqFn }) => eqFn(ws.id, weekRow.id),
      with: {
        days: {
          with: { tasks: true },
          orderBy: (d, { asc }) => [asc(d.day)]
        }
      }
    })

    return { week: formatWeek(fullWeek!) }
  } catch (error) {
    return handleUnknownError(event, 'creating scheduler week', error)
  }
})
