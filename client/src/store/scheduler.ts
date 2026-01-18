import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { WeekSchedule, DaySchedule, ScheduledTask, TaskDefinition, TaskType, TimeSlot, SchedulerStore } from '../types/store/scheduler'

// Centralized error logging for store operations
const logStoreError = (storeName: string, operation: string, error: unknown) => {
  console.error(`[${storeName}] Error ${operation}:`, error)
  if (error && typeof error === 'object' && 'response' in error && error.response) {
    const axiosError = error as { response: { status: number; data: unknown } }
    console.error(`[${storeName}] Response status: ${axiosError.response.status}`)
    console.error(`[${storeName}] Response data:`, axiosError.response.data)
  }
}

export const useSchedulerStore = defineStore('scheduler', () => {
  const currentWeek = ref<WeekSchedule | null>(null)
  const taskDefinitions = ref<TaskDefinition[]>([])

  const initializeWeek = async (startDate?: Date) => {
    // Always create a new week, replacing any existing one
    const weekStart = getWeekStart(startDate)

    const days: DaySchedule[] = []
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart)
      dayDate.setDate(weekStart.getDate() + i)

      days.push({
        day: i,
        dayName: dayDate.toLocaleDateString('en-US', { weekday: 'long' }),
        totalUnits: 0,
        morning: undefined,
        afternoon: undefined,
        evening: undefined
      })
    }

    currentWeek.value = {
      id: Date.now().toString(),
      weekStartDate: weekStart.toISOString(),
      days,
      totalScheduledUnits: 0,
      freeTimeUsed: false
    }

    await saveSchedulerState()
  }

  const getWeekStart = (startDate?: Date): Date => {
    const date = startDate || new Date()
    const dayOfWeek = date.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - daysToSubtract)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }

  const canScheduleTask = (taskType: TaskType, day: number, timeSlot: TimeSlot): boolean => {
    if (!currentWeek.value) return false

    const daySchedule = currentWeek.value.days[day]
    if (!daySchedule) return false

    const timeSlotAvailable = !daySchedule[timeSlot.toLowerCase() as keyof DaySchedule]
    if (!timeSlotAvailable) return false

    const taskDef = taskDefinitions.value.find(t => t.type === taskType)
    if (!taskDef) return false

    if (taskDef.restrictions?.timeSlots && !taskDef.restrictions.timeSlots.includes(timeSlot)) {
      return false
    }

    if (taskDef.restrictions?.maxPerWeek) {
      const currentCount = getTaskTypeCount(taskType)
      if (currentCount >= taskDef.restrictions.maxPerWeek) {
        return false
      }
    }

    const remainingUnits = getRemainingTimeUnits(day)
    return remainingUnits >= taskDef.timeUnits
  }

  const getTaskTypeCount = (taskType: TaskType): number => {
    if (!currentWeek.value) return 0

    let count = 0
    for (const day of currentWeek.value.days) {
      if (day.morning?.type === taskType) count++
      if (day.afternoon?.type === taskType) count++
      if (day.evening?.type === taskType) count++
    }
    return count
  }

  const scheduleTask = (taskType: TaskType, day: number, timeSlot: TimeSlot, details?: Record<string, unknown>): boolean => {
    if (!canScheduleTask(taskType, day, timeSlot)) {
      return false
    }

    const taskDef = taskDefinitions.value.find(t => t.type === taskType)
    if (!taskDef) return false

    const task: ScheduledTask = {
      id: Date.now().toString(),
      type: taskType,
      timeUnits: taskDef.timeUnits,
      day,
      timeSlot,
      notes: details?.notes as string,
      details: details
    }

    // Create a new object to ensure reactivity
    if (currentWeek.value) {
      const newWeek = { ...currentWeek.value }
      const newDays = [...newWeek.days]
      const newDay = { ...newDays[day] }

      newDay[timeSlot.toLowerCase() as keyof DaySchedule] = task
      newDay.totalUnits += taskDef.timeUnits

      newDays[day] = newDay
      newWeek.days = newDays

      if (taskType === 'FREE_TIME') {
        newWeek.freeTimeUsed = true
      }

      // Calculate total scheduled units
      newWeek.totalScheduledUnits = newDays.reduce((total, day) => total + day.totalUnits, 0)

      currentWeek.value = newWeek
    }

    // Save state asynchronously but don't block the UI update
    saveSchedulerState().catch(error => {
      console.error('Failed to save scheduler state:', error)
    })

    return true
  }

  const removeLastTask = (): boolean => {
    if (!currentWeek.value) return false

    let lastTask: ScheduledTask | null = null
    let lastDay = -1
    let lastTimeSlot: TimeSlot | null = null

    for (let day = currentWeek.value.days.length - 1; day >= 0; day--) {
      const daySchedule = currentWeek.value.days[day]
      if (daySchedule.evening) {
        lastTask = daySchedule.evening
        lastDay = day
        lastTimeSlot = 'EVENING'
        break
      }
      if (daySchedule.afternoon) {
        lastTask = daySchedule.afternoon
        lastDay = day
        lastTimeSlot = 'AFTERNOON'
        break
      }
      if (daySchedule.morning) {
        lastTask = daySchedule.morning
        lastDay = day
        lastTimeSlot = 'MORNING'
        break
      }
    }

    if (lastTask && lastDay >= 0 && lastTimeSlot) {
      // Create a new object to ensure reactivity
      const newWeek = { ...currentWeek.value }
      const newDays = [...newWeek.days]
      const newDay = { ...newDays[lastDay] }

      newDay[lastTimeSlot.toLowerCase() as keyof DaySchedule] = undefined
      newDay.totalUnits -= lastTask.timeUnits

      newDays[lastDay] = newDay
      newWeek.days = newDays

      if (lastTask.type === 'FREE_TIME') {
        newWeek.freeTimeUsed = false
      }

      // Calculate total scheduled units
      newWeek.totalScheduledUnits = newDays.reduce((total, day) => total + day.totalUnits, 0)

      currentWeek.value = newWeek

      // Save state asynchronously but don't block the UI update
      saveSchedulerState().catch(error => {
        console.error('Failed to save scheduler state:', error)
      })

      return true
    }

    return false
  }

  const getAvailableTimeSlots = (day: number): TimeSlot[] => {
    if (!currentWeek.value || day < 0 || day >= currentWeek.value.days.length) {
      return []
    }

    const daySchedule = currentWeek.value.days[day]
    const availableSlots: TimeSlot[] = []

    if (!daySchedule.morning) availableSlots.push('MORNING')
    if (!daySchedule.afternoon) availableSlots.push('AFTERNOON')
    if (!daySchedule.evening) availableSlots.push('EVENING')

    return availableSlots
  }

  const getRemainingTimeUnits = (day: number): number => {
    if (!currentWeek.value || day < 0 || day >= currentWeek.value.days.length) {
      return 0
    }

    const daySchedule = currentWeek.value.days[day]
    return 24 - daySchedule.totalUnits
  }

  const getAvailableTasks = (day: number): TaskDefinition[] => {
    const remainingUnits = getRemainingTimeUnits(day)
    return taskDefinitions.value.filter(taskDef => {
      if (taskDef.timeUnits > remainingUnits) {
        return false
      }

      if (taskDef.restrictions?.maxPerWeek) {
        const currentCount = getTaskTypeCount(taskDef.type)
        return currentCount < taskDef.restrictions.maxPerWeek
      }

      return true
    })
  }

  const saveSchedulerState = async () => {
    if (!currentWeek.value) return

    try {
      const response = await axios.post('/api/scheduler/save', {
        currentWeek: currentWeek.value,
        taskDefinitions: taskDefinitions.value
      })

      if (response.data.weekSchedule) {
        // Create a new object to ensure reactivity
        currentWeek.value = { ...currentWeek.value, id: response.data.weekSchedule.id }
      }
    } catch (error: unknown) {
      logStoreError('Scheduler Store', 'saving scheduler state', error)
      throw error
    }
  }

  const loadSchedulerState = async () => {
    try {
      const response = await axios.get('/api/scheduler/load')
      const { weekSchedule, savedTaskDefinitions } = response.data

      if (weekSchedule) {
        // Ensure totalScheduledUnits is calculated correctly
        const recalculatedWeek = {
          ...weekSchedule,
          totalScheduledUnits: weekSchedule.days.reduce((total: number, day: DaySchedule) => total + day.totalUnits, 0)
        }
        currentWeek.value = recalculatedWeek
      }

      if (savedTaskDefinitions && savedTaskDefinitions.length > 0) {
        taskDefinitions.value = savedTaskDefinitions
      }
    } catch (error) {
      console.error('Failed to load scheduler state:', error)
      throw error
    }
  }

  const loadCurrentSchedulerState = async () => {
    try {
      const response = await axios.get('/api/scheduler/')
      const { currentWeek: savedWeek, taskDefinitions: savedTaskDefinitions } = response.data

      if (savedWeek) {
        // Ensure totalScheduledUnits is calculated correctly
        const recalculatedWeek = {
          ...savedWeek,
          totalScheduledUnits: savedWeek.days.reduce((total: number, day: DaySchedule) => total + day.totalUnits, 0)
        }
        currentWeek.value = recalculatedWeek
      }

      if (savedTaskDefinitions && savedTaskDefinitions.length > 0) {
        taskDefinitions.value = savedTaskDefinitions
      }
    } catch (error) {
      console.error('Failed to load current scheduler state:', error)
      throw error
    }
  }

  const deleteCurrentWeek = async () => {
    try {
      if (!currentWeek.value) return

      const response = await axios.delete('/api/scheduler/')
      const { deletedWeeks } = response.data

      if (deletedWeeks > 0) {
        // Clear the current week completely
        currentWeek.value = null
        taskDefinitions.value = []
      }
    } catch (error) {
      console.error('Failed to delete current week:', error)
      throw error
    }
  }

  const cleanupScheduler = async () => {
    try {
      await axios.post('/api/scheduler/cleanup')
      // Clear the current week completely
      currentWeek.value = null
      taskDefinitions.value = []
    } catch (error) {
      console.error('Failed to cleanup scheduler:', error)
      throw error
    }
  }

  const saveNotes = async (): Promise<void> => {
    if (!currentWeek.value) return

    try {
      const response = await axios.post('/api/scheduler/save', {
        currentWeek: currentWeek.value,
        taskDefinitions: taskDefinitions.value
      })

      if (response.data.weekSchedule) {
        // Create a new object to ensure reactivity
        currentWeek.value = { ...currentWeek.value, id: response.data.weekSchedule.id }
      }
    } catch (error) {
      console.error('Failed to save notes:', error)
      throw error
    }
  }

  return {
    currentWeek,
    taskDefinitions,
    initializeWeek,
    canScheduleTask,
    scheduleTask,
    removeLastTask,
    getAvailableTimeSlots,
    getRemainingTimeUnits,
    getAvailableTasks,
    getTaskTypeCount,
    saveSchedulerState,
    saveNotes,
    loadSchedulerState,
    loadCurrentSchedulerState,
    deleteCurrentWeek,
    cleanupScheduler
  } satisfies SchedulerStore
})
