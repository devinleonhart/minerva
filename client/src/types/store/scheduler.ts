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
  id: string
  type: TaskType
  timeUnits: number
  day: number
  timeSlot: TimeSlot
  notes?: string
  details?: {
    ingredientId?: number
    recipeId?: number
    spellName?: string
    description?: string
  }
}

export interface DaySchedule {
  day: number
  dayName: string
  morning?: ScheduledTask
  afternoon?: ScheduledTask
  evening?: ScheduledTask
  totalUnits: number
  [key: string]: number | string | ScheduledTask | undefined
}

export interface WeekSchedule {
  id: string
  weekStartDate: string
  days: DaySchedule[]
  totalScheduledUnits: number
  freeTimeUsed: boolean
}

export interface TaskDefinition {
  type: TaskType
  name: string
  timeUnits: number
  color: string
  description: string
  restrictions?: {
    timeSlots?: TimeSlot[]
    maxPerWeek?: number
  }
}

export interface SchedulerStore {
  currentWeek: Ref<WeekSchedule | null>
  taskDefinitions: Ref<TaskDefinition[]>
  initializeWeek: (startDate?: Date) => Promise<void>
  canScheduleTask: (taskType: TaskType, day: number, timeSlot: TimeSlot) => boolean
  scheduleTask: (taskType: TaskType, day: number, timeSlot: TimeSlot, details?: Record<string, unknown>) => boolean
  removeLastTask: () => boolean
  getAvailableTimeSlots: (day: number) => TimeSlot[]
  getRemainingTimeUnits: (day: number) => number
  getAvailableTasks: (day: number) => TaskDefinition[]
  getTaskTypeCount: (taskType: TaskType) => number
  saveSchedulerState: () => Promise<void>
  saveNotes: () => Promise<void>
  loadSchedulerState: (weekStartDate?: string) => Promise<void>
  loadCurrentSchedulerState: () => Promise<void>
  deleteCurrentWeek: () => Promise<void>
  cleanupScheduler: () => Promise<void>
}
