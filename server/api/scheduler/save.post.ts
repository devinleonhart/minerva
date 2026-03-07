import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { weekSchedule, daySchedule, scheduledTask, taskDefinition } from '../../db/index.js'
import { eq } from 'drizzle-orm'

type TaskTypeValue = 'GATHER_INGREDIENT' | 'BREWING' | 'SECURE_INGREDIENTS' | 'RESEARCH_RECIPES' | 'RESEARCH_SPELL' | 'FREE_TIME'

type SchedulerSaveBody = {
  currentWeek: {
    weekStartDate: string
    totalScheduledUnits: number
    freeTimeUsed: boolean
    days: Array<{
      day: number
      dayName: string
      totalUnits: number
      morning?: { type: TaskTypeValue; timeUnits: number; notes?: string | null; details?: unknown } | null
      afternoon?: { type: TaskTypeValue; timeUnits: number; notes?: string | null; details?: unknown } | null
      evening?: { type: TaskTypeValue; timeUnits: number; notes?: string | null; details?: unknown } | null
    }>
  }
  taskDefinitions: Array<{
    type: TaskTypeValue
    name: string
    timeUnits: number
    color: string
    description: string
    restrictions?: unknown
  }>
}

export default eventHandler(async (event) => {
  try {
    const { currentWeek, taskDefinitions } = (await readBody(event) ?? {}) as SchedulerSaveBody

    if (!currentWeek || !taskDefinitions) {
      setResponseStatus(event, 400)
      return {
        error: 'Missing required fields: currentWeek and taskDefinitions'
      }
    }

    const normalizedWeekStart = new Date(currentWeek.weekStartDate)
    normalizedWeekStart.setHours(0, 0, 0, 0)
    const normalizedDateStr = normalizedWeekStart.toISOString().split('T')[0]!

    const existingWeeks = await db.select().from(weekSchedule)
    let isUpdate = false
    let existingWeekId: number | null = null

    if (existingWeeks.length > 0) {
      const existingWeek = existingWeeks.find(week =>
        week.weekStartDate.startsWith(normalizedDateStr)
      )

      if (existingWeek) {
        isUpdate = true
        existingWeekId = existingWeek.id
      } else {
        setResponseStatus(event, 400)
        return {
          error: 'A week already exists. Please delete the current week first',
          existingWeekId: existingWeeks[0]!.id,
          existingWeekCount: existingWeeks.length
        }
      }
    }

    const result = await db.transaction(async (tx) => {
      let weekRow: typeof weekSchedule.$inferSelect

      if (isUpdate) {
        const [updated] = await tx.update(weekSchedule)
          .set({
            totalScheduledUnits: currentWeek.totalScheduledUnits,
            freeTimeUsed: currentWeek.freeTimeUsed,
            updatedAt: new Date().toISOString()
          })
          .where(eq(weekSchedule.id, existingWeekId!))
          .returning()
        weekRow = updated!

        // Delete existing days (cascades to tasks)
        await tx.delete(daySchedule).where(eq(daySchedule.weekScheduleId, weekRow.id))
      } else {
        const [created] = await tx.insert(weekSchedule).values({
          weekStartDate: normalizedWeekStart.toISOString(),
          totalScheduledUnits: currentWeek.totalScheduledUnits,
          freeTimeUsed: currentWeek.freeTimeUsed,
          updatedAt: new Date().toISOString()
        }).returning()
        weekRow = created!
      }

      for (const day of currentWeek.days) {
        const [dayRow] = await tx.insert(daySchedule).values({
          weekScheduleId: weekRow.id,
          day: day.day,
          dayName: day.dayName,
          totalUnits: day.totalUnits,
          updatedAt: new Date().toISOString()
        }).returning()

        const slots = [
          { slot: 'MORNING' as const, data: day.morning },
          { slot: 'AFTERNOON' as const, data: day.afternoon },
          { slot: 'EVENING' as const, data: day.evening }
        ]

        for (const { slot, data } of slots) {
          if (data) {
            await tx.insert(scheduledTask).values({
              type: data.type,
              timeUnits: data.timeUnits,
              day: day.day,
              timeSlot: slot,
              notes: data.notes || null,
              details: data.details || null,
              dayScheduleId: dayRow!.id,
              updatedAt: new Date().toISOString()
            })
          }
        }
      }

      for (const taskDef of taskDefinitions) {
        await tx.insert(taskDefinition).values({
          type: taskDef.type,
          name: taskDef.name,
          timeUnits: taskDef.timeUnits,
          color: taskDef.color,
          description: taskDef.description,
          restrictions: taskDef.restrictions || null,
          updatedAt: new Date().toISOString()
        }).onConflictDoUpdate({
          target: taskDefinition.type,
          set: {
            name: taskDef.name,
            timeUnits: taskDef.timeUnits,
            color: taskDef.color,
            description: taskDef.description,
            restrictions: taskDef.restrictions || null,
            updatedAt: new Date().toISOString()
          }
        })
      }

      return { weekSchedule: weekRow }
    })

    return {
      success: true,
      message: 'Scheduler state saved successfully',
      savedAt: new Date().toISOString(),
      weekScheduleId: result.weekSchedule.id
    }
  } catch (error) {
    return handleUnknownError(event, 'saving scheduler state', error)
  }
})
