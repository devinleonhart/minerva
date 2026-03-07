import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { scheduledTask } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { parseId } from '../../../utils/parseId.js'
import { formatWeek } from '../../../utils/schedulerWeek.js'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid task ID' }
    }

    const task = await db.query.scheduledTask.findFirst({
      where: (st, { eq: eqFn }) => eqFn(st.id, id),
      with: {
        daySchedule: true
      }
    })

    if (!task) {
      setResponseStatus(event, 404)
      return { error: 'Task not found' }
    }

    const weekId = task.daySchedule.weekScheduleId

    await db.delete(scheduledTask).where(eq(scheduledTask.id, id))

    const fullWeek = await db.query.weekSchedule.findFirst({
      where: (ws, { eq: eqFn }) => eqFn(ws.id, weekId),
      with: {
        days: {
          with: { tasks: true },
          orderBy: (d, { asc }) => [asc(d.day)]
        }
      }
    })

    return { week: formatWeek(fullWeek!) }
  } catch (error) {
    return handleUnknownError(event, 'deleting task', error)
  }
})
