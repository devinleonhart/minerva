import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { WeekSchedule, TaskType, TimeSlot } from '@/types/store/scheduler'

export const useSchedulerStore = defineStore('scheduler', () => {
  const week = ref<WeekSchedule | null>(null)

  async function loadWeek() {
    const { data } = await axios.get('/api/scheduler/week')
    week.value = data.week
  }

  async function createWeek() {
    const { data } = await axios.post('/api/scheduler/week')
    week.value = data.week
  }

  async function deleteWeek() {
    await axios.delete('/api/scheduler/week')
    week.value = null
  }

  async function addTask(weekId: number, day: number, timeSlot: TimeSlot, taskType: TaskType, notes?: string) {
    const { data } = await axios.post('/api/scheduler/tasks', { weekId, day, timeSlot, taskType, notes })
    week.value = data.week
  }

  async function updateTaskNotes(taskId: number, notes: string) {
    await axios.patch(`/api/scheduler/tasks/${taskId}`, { notes })
    if (!week.value) return
    for (const day of week.value.days) {
      for (const slot of ['MORNING', 'AFTERNOON', 'EVENING'] as TimeSlot[]) {
        const task = day.tasks[slot]
        if (task?.id === taskId) {
          task.notes = notes
          return
        }
      }
    }
  }

  async function removeTask(taskId: number) {
    const { data } = await axios.delete(`/api/scheduler/tasks/${taskId}`)
    week.value = data.week
  }

  return { week, loadWeek, createWeek, deleteWeek, addTask, updateTaskNotes, removeTask }
})
