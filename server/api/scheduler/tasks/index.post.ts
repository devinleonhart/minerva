import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { scheduledTask } from '../../../db/index.js'
import { formatWeek, TASK_UNITS, TASK_VALID_SLOTS, SLOT_ORDER } from '../../../utils/schedulerWeek.js'
import type { TaskType, TimeSlot } from '../../../utils/schedulerWeek.js'

const VALID_TASK_TYPES = new Set<TaskType>([
  'GATHER_INGREDIENT', 'BREWING', 'SECURE_INGREDIENTS',
  'RESEARCH_RECIPES', 'RESEARCH_SPELL', 'FREE_TIME'
])

const VALID_SLOTS = new Set<TimeSlot>(['MORNING', 'AFTERNOON', 'EVENING'])

export default eventHandler(async (event) => {
  try {
    const body = (await readBody(event) ?? {}) as {
      weekId?: number
      day?: number
      timeSlot?: string
      taskType?: string
      notes?: string
    }

    const { weekId, day, timeSlot, taskType, notes } = body

    if (weekId === undefined || day === undefined || !timeSlot || !taskType) {
      setResponseStatus(event, 400)
      return { error: 'Missing required fields: weekId, day, timeSlot, taskType' }
    }

    if (!VALID_TASK_TYPES.has(taskType as TaskType)) {
      setResponseStatus(event, 400)
      return { error: `Invalid task type: ${taskType}` }
    }

    if (!VALID_SLOTS.has(timeSlot as TimeSlot)) {
      setResponseStatus(event, 400)
      return { error: `Invalid time slot: ${timeSlot}` }
    }

    const type = taskType as TaskType
    const slot = timeSlot as TimeSlot

    const validSlots = TASK_VALID_SLOTS[type]
    if (!validSlots.includes(slot)) {
      setResponseStatus(event, 400)
      return { error: `${taskType} cannot start at ${timeSlot}` }
    }

    const startIndex = SLOT_ORDER.indexOf(slot)
    const units = TASK_UNITS[type]

    if (startIndex + units > 3) {
      setResponseStatus(event, 400)
      return { error: 'Task does not fit within the day' }
    }

    const dayRow = await db.query.daySchedule.findFirst({
      where: (ds, { and: andFn, eq: eqFn }) => andFn(
        eqFn(ds.weekScheduleId, weekId),
        eqFn(ds.day, day)
      ),
      with: { tasks: true }
    })

    if (!dayRow) {
      setResponseStatus(event, 404)
      return { error: 'Day schedule not found' }
    }

    const neededSlots = SLOT_ORDER.slice(startIndex, startIndex + units)
    for (const neededSlot of neededSlots) {
      if (dayRow.tasks.some(t => t.timeSlot === neededSlot)) {
        setResponseStatus(event, 409)
        return { error: `Time slot ${neededSlot} is already occupied` }
      }
    }

    await db.insert(scheduledTask).values({
      dayScheduleId: dayRow.id,
      type,
      timeSlot: slot,
      timeUnits: units,
      day,
      notes: notes ?? null,
      updatedAt: new Date().toISOString()
    })

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
    return handleUnknownError(event, 'adding scheduler task', error)
  }
})
