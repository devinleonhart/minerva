import type { TaskType, TimeSlot } from '@/types/store/scheduler'

export interface TaskMeta {
  label: string
  emoji: string
  color: string
  units: number
  validStartSlots: TimeSlot[]
}

export const TASK_META: Record<TaskType, TaskMeta> = {
  GATHER_INGREDIENT: {
    label: 'Gather Ingredient',
    emoji: '🟥',
    color: '#ef4444',
    units: 1,
    validStartSlots: ['MORNING', 'AFTERNOON', 'EVENING']
  },
  BREWING: {
    label: 'Brewing',
    emoji: '🟦',
    color: '#3b82f6',
    units: 1,
    validStartSlots: ['AFTERNOON', 'EVENING']
  },
  SECURE_INGREDIENTS: {
    label: 'Secure Ingredients',
    emoji: '🟨',
    color: '#eab308',
    units: 2,
    validStartSlots: ['MORNING', 'AFTERNOON']
  },
  RESEARCH_RECIPES: {
    label: 'Research Recipes',
    emoji: '🟩',
    color: '#22c55e',
    units: 3,
    validStartSlots: ['MORNING']
  },
  RESEARCH_SPELL: {
    label: 'Research Spell',
    emoji: '🟧',
    color: '#f97316',
    units: 3,
    validStartSlots: ['MORNING']
  },
  FREE_TIME: {
    label: 'Free Time',
    emoji: '🟪',
    color: '#a855f7',
    units: 3,
    validStartSlots: ['MORNING']
  }
}

export const SLOT_ORDER: TimeSlot[] = ['MORNING', 'AFTERNOON', 'EVENING']

export type SlotState =
  | { kind: 'task'; task: import('@/types/store/scheduler').ScheduledTask }
  | { kind: 'continuation'; sourceTask: import('@/types/store/scheduler').ScheduledTask }
  | { kind: 'available' }

export function getSlotState(
  tasks: { MORNING: import('@/types/store/scheduler').ScheduledTask | null; AFTERNOON: import('@/types/store/scheduler').ScheduledTask | null; EVENING: import('@/types/store/scheduler').ScheduledTask | null },
  slot: TimeSlot
): SlotState {
  const task = tasks[slot]
  if (task) return { kind: 'task', task }

  if (slot === 'AFTERNOON' && tasks.MORNING && tasks.MORNING.timeUnits >= 2) {
    return { kind: 'continuation', sourceTask: tasks.MORNING }
  }
  if (slot === 'EVENING') {
    if (tasks.AFTERNOON && tasks.AFTERNOON.timeUnits >= 2) {
      return { kind: 'continuation', sourceTask: tasks.AFTERNOON }
    }
    if (tasks.MORNING && tasks.MORNING.timeUnits >= 3) {
      return { kind: 'continuation', sourceTask: tasks.MORNING }
    }
  }

  return { kind: 'available' }
}

export function isSlotFree(
  tasks: { MORNING: import('@/types/store/scheduler').ScheduledTask | null; AFTERNOON: import('@/types/store/scheduler').ScheduledTask | null; EVENING: import('@/types/store/scheduler').ScheduledTask | null },
  slot: TimeSlot
): boolean {
  return getSlotState(tasks, slot).kind === 'available'
}

export function getAvailableTaskTypes(
  tasks: { MORNING: import('@/types/store/scheduler').ScheduledTask | null; AFTERNOON: import('@/types/store/scheduler').ScheduledTask | null; EVENING: import('@/types/store/scheduler').ScheduledTask | null },
  slot: TimeSlot
): TaskType[] {
  const slotIndex = SLOT_ORDER.indexOf(slot)

  return (Object.keys(TASK_META) as TaskType[]).filter(type => {
    const meta = TASK_META[type]

    if (!meta.validStartSlots.includes(slot)) return false

    const neededSlots = SLOT_ORDER.slice(slotIndex, slotIndex + meta.units)
    return neededSlots.every(s => isSlotFree(tasks, s))
  })
}
