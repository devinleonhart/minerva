import type { weekSchedule as WeekScheduleTable, daySchedule as DayScheduleTable, scheduledTask as ScheduledTaskTable } from '../db/schema.js'

type WeekRow = typeof WeekScheduleTable.$inferSelect & {
  days: Array<typeof DayScheduleTable.$inferSelect & {
    tasks: Array<typeof ScheduledTaskTable.$inferSelect>
  }>
}

function toISO(ts: string): string {
  return ts.includes('T') ? ts : ts.replace(' ', 'T') + 'Z'
}

function formatTask(t: typeof ScheduledTaskTable.$inferSelect) {
  return {
    id: t.id,
    type: t.type,
    timeUnits: t.timeUnits,
    notes: t.notes ?? null
  }
}

export function formatWeek(week: WeekRow) {
  return {
    id: week.id,
    weekStartDate: toISO(week.weekStartDate),
    days: week.days.map(day => {
      const morning = day.tasks.find(t => t.timeSlot === 'MORNING')
      const afternoon = day.tasks.find(t => t.timeSlot === 'AFTERNOON')
      const evening = day.tasks.find(t => t.timeSlot === 'EVENING')

      return {
        id: day.id,
        day: day.day,
        dayName: day.dayName,
        tasks: {
          MORNING: morning ? formatTask(morning) : null,
          AFTERNOON: afternoon ? formatTask(afternoon) : null,
          EVENING: evening ? formatTask(evening) : null
        }
      }
    })
  }
}

export type TaskType = 'GATHER_INGREDIENT' | 'BREWING' | 'SECURE_INGREDIENTS' | 'RESEARCH_RECIPES' | 'RESEARCH_SPELL' | 'FREE_TIME'
export type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING'

export const TASK_UNITS: Record<TaskType, number> = {
  GATHER_INGREDIENT: 1,
  BREWING: 1,
  SECURE_INGREDIENTS: 2,
  RESEARCH_RECIPES: 3,
  RESEARCH_SPELL: 3,
  FREE_TIME: 3
}

export const TASK_VALID_SLOTS: Record<TaskType, TimeSlot[]> = {
  GATHER_INGREDIENT: ['MORNING', 'AFTERNOON', 'EVENING'],
  BREWING: ['AFTERNOON', 'EVENING'],
  SECURE_INGREDIENTS: ['MORNING', 'AFTERNOON'],
  RESEARCH_RECIPES: ['MORNING'],
  RESEARCH_SPELL: ['MORNING'],
  FREE_TIME: ['MORNING']
}

export const SLOT_ORDER: TimeSlot[] = ['MORNING', 'AFTERNOON', 'EVENING']
