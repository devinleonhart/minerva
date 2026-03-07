import type { Ref } from 'vue'

export type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING'

export type TaskType =
  | 'GATHER_INGREDIENT'
  | 'BREWING'
  | 'SECURE_INGREDIENTS'
  | 'RESEARCH_RECIPES'
  | 'RESEARCH_SPELL'
  | 'FREE_TIME'

export interface ScheduledTask {
  id: number
  type: TaskType
  timeUnits: number
  notes: string | null
}

export interface DaySchedule {
  id: number
  day: number
  dayName: string
  tasks: {
    MORNING: ScheduledTask | null
    AFTERNOON: ScheduledTask | null
    EVENING: ScheduledTask | null
  }
}

export interface WeekSchedule {
  id: number
  weekStartDate: string
  days: DaySchedule[]
}

export interface SchedulerStore {
  week: Ref<WeekSchedule | null>
  loadWeek: () => Promise<void>
  createWeek: () => Promise<void>
  deleteWeek: () => Promise<void>
  addTask: (weekId: number, day: number, timeSlot: TimeSlot, taskType: TaskType, notes?: string) => Promise<void>
  updateTaskNotes: (taskId: number, notes: string) => Promise<void>
  removeTask: (taskId: number) => Promise<void>
}
