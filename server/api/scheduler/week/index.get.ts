import { eventHandler } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { weekSchedule } from '../../../db/index.js'
import { desc } from 'drizzle-orm'
import { formatWeek } from '../../../utils/schedulerWeek.js'

export default eventHandler(async (event) => {
  try {
    const week = await db.query.weekSchedule.findFirst({
      with: {
        days: {
          with: { tasks: true },
          orderBy: (d, { asc }) => [asc(d.day)]
        }
      },
      orderBy: [desc(weekSchedule.weekStartDate)]
    })

    if (!week) return { week: null }

    return { week: formatWeek(week) }
  } catch (error) {
    return handleUnknownError(event, 'getting scheduler week', error)
  }
})
