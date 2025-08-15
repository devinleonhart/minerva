<template>
  <ViewLayout>
    <ViewHeader>
      <template #left>
        <div class="header-actions">
          <n-button @click="initializeNewWeek" type="primary" size="large" :disabled="!!currentWeek">
            New Week
          </n-button>
          <n-button @click="removeLastTask" :disabled="!canRemoveTask" type="error" size="large">
            Remove Last Task
          </n-button>
          <n-button v-if="currentWeek" @click="deleteCurrentWeek" type="error" size="large">
            Delete Week
          </n-button>
          <n-button v-if="currentWeek" @click="saveNotes" type="success" size="large">
            Save Notes
          </n-button>
        </div>
      </template>
    </ViewHeader>

    <div v-if="!currentWeek" class="no-schedule">
      <n-empty description="No week schedule created yet. Click 'New Week' to get started!" />
    </div>

    <div v-else class="scheduler-content">
      <!-- Week Summary -->
      <div class="week-summary">
        <n-card size="small">
          <div class="summary-stats">
            <div class="stat">
              <span class="stat-label">Week Starting:</span>
              <span class="stat-value">{{ formatDate(currentWeek.weekStartDate) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Total Scheduled:</span>
              <span class="stat-value">{{ currentWeek.totalScheduledUnits }}/21 units</span>
            </div>
            <div class="stat">
              <span class="stat-label">Free Time Used:</span>
              <span class="stat-value" :class="{ 'used': currentWeek.freeTimeUsed }">
                {{ currentWeek.freeTimeUsed ? 'Yes' : 'No' }}
              </span>
            </div>
          </div>
        </n-card>
      </div>

      <!-- Week Schedule Grid -->
      <div class="week-grid">
        <div v-for="(day, dayIndex) in currentWeek.days" :key="day.day" class="day-column">
          <div class="day-header">
            <h3 class="day-name">{{ day.dayName }}</h3>
            <div class="day-units">
              <span class="units-label">Units:</span>
              <span class="units-value" :class="{ 'full': day.totalUnits === 3 }">
                {{ day.totalUnits }}/3
              </span>
            </div>
          </div>

          <!-- Time Slots -->
          <div class="time-slots">
            <div class="time-slot morning">
              <div class="slot-header">
                <span class="slot-name">Morning</span>
                <span class="slot-units">1 unit</span>
              </div>
              <div v-if="day.morning" class="scheduled-task" :style="{ borderColor: getTaskColor(day.morning.type) }">
                <div class="task-name">{{ getTaskName(day.morning.type) }}</div>
                <div class="task-units">{{ day.morning.timeUnits }} unit(s)</div>
                <div class="task-notes">
                  <n-input
                    v-model:value="day.morning.notes"
                    type="textarea"
                    placeholder="Add notes..."
                    :rows="2"
                    size="small"
                  />
                </div>
              </div>
              <div v-else-if="canAddToDay(dayIndex)" class="add-task-button">
                <n-button @click="showTaskSelector(dayIndex, 'MORNING')" size="small" type="primary">
                  Add Task
                </n-button>
              </div>
              <div v-else class="slot-unavailable">
                <span class="unavailable-text">Unavailable</span>
              </div>
            </div>

            <div class="time-slot afternoon">
              <div class="slot-header">
                <span class="slot-name">Afternoon</span>
                <span class="slot-units">1 unit</span>
              </div>
              <div v-if="day.afternoon" class="scheduled-task" :style="{ borderColor: getTaskColor(day.afternoon.type) }">
                <div class="task-name">{{ getTaskName(day.afternoon.type) }}</div>
                <div class="task-units">{{ day.afternoon.timeUnits }} unit(s)</div>
                <div class="task-notes">
                  <n-input
                    v-model:value="day.afternoon.notes"
                    type="textarea"
                    placeholder="Add notes..."
                    :rows="2"
                    size="small"
                  />
                </div>
              </div>
              <div v-else-if="canAddToDay(dayIndex)" class="add-task-button">
                <n-button @click="showTaskSelector(dayIndex, 'AFTERNOON')" size="small" type="primary">
                  Add Task
                </n-button>
              </div>
              <div v-else class="slot-unavailable">
                <span class="unavailable-text">Unavailable</span>
              </div>
            </div>

            <div class="time-slot evening">
              <div class="slot-header">
                <span class="slot-name">Evening</span>
                <span class="slot-units">1 unit</span>
              </div>
              <div v-if="day.evening" class="scheduled-task" :style="{ borderColor: getTaskColor(day.evening.type) }">
                <div class="task-name">{{ getTaskName(day.evening.type) }}</div>
                <div class="task-units">{{ day.evening.timeUnits }} unit(s)</div>
                <div class="task-notes">
                  <n-input
                    v-model:value="day.evening.notes"
                    type="textarea"
                    placeholder="Add notes..."
                    :rows="2"
                    size="small"
                  />
                </div>
              </div>
              <div v-else-if="canAddToDay(dayIndex)" class="add-task-button">
                <n-button @click="showTaskSelector(dayIndex, 'EVENING')" size="small" type="primary">
                  Add Task
                </n-button>
              </div>
              <div v-else class="slot-unavailable">
                <span class="unavailable-text">Unavailable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Selector Modal -->
    <n-modal v-model:show="showTaskModal" preset="card" title="Select Task" style="width: 600px">
      <div class="task-selector">
        <div class="modal-info">
          <p><strong>Day:</strong> {{ selectedDayName }}</p>
          <p><strong>Time Slot:</strong> {{ selectedTimeSlot }}</p>
          <p><strong>Available Units:</strong> {{ getRemainingTimeUnits(selectedDay) }}</p>
        </div>

        <n-divider />

        <div class="available-tasks">
          <h4>Available Tasks:</h4>
          <div class="task-list">
            <div
              v-for="task in availableTasks"
              :key="task.type"
              class="task-option"
              :class="{ 'disabled': !canScheduleTask(task.type, selectedDay, selectedTimeSlot) }"
              @click="selectTask(task.type)"
            >
              <div class="task-option-header">
                <span class="task-emoji" :style="{ color: task.color }">{{ task.name.split(' ')[0] }}</span>
                <span class="task-option-name">{{ task.name.split(' ').slice(1).join(' ') }}</span>
                <span class="task-option-units">{{ task.timeUnits }} unit(s)</span>
              </div>
              <div class="task-option-description">{{ task.description }}</div>
            </div>
          </div>
        </div>

        <n-divider />

        <n-space justify="end">
          <n-button @click="showTaskModal = false">Cancel</n-button>
        </n-space>
      </div>
    </n-modal>
  </ViewLayout>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSchedulerStore } from '@/store/scheduler'
import { useToast } from '@/composables/useToast'
import type { TaskType, TimeSlot } from '../types/store/scheduler'
import {
  NButton,
  NCard,
  NModal,
  NDivider,
  NSpace,
  NEmpty,
  NInput
} from 'naive-ui'
import ViewLayout from '@/components/shared/ViewLayout.vue'
import ViewHeader from '@/components/shared/ViewHeader.vue'

const schedulerStore = useSchedulerStore()
const toast = useToast()

const { currentWeek, taskDefinitions } = storeToRefs(schedulerStore)
const {
  initializeWeek,
  removeLastTask,
  canScheduleTask,
  scheduleTask,
  getRemainingTimeUnits,
  getAvailableTasks
} = schedulerStore

const showTaskModal = ref(false)
const selectedDay = ref(0)
const selectedTimeSlot = ref<TimeSlot>('MORNING')

const selectedDayName = computed(() => {
  if (!currentWeek.value) return ''
  return currentWeek.value.days[selectedDay.value]?.dayName || ''
})

const availableTasks = computed(() => {
  if (!currentWeek.value) return []
  return getAvailableTasks(selectedDay.value)
})

const canRemoveTask = computed(() => {
  if (!currentWeek.value) return false
  return currentWeek.value.totalScheduledUnits > 0
})

const initializeNewWeek = async () => {
  try {
    await initializeWeek()
    toast.success('New week schedule created!')
  } catch (error) {
    console.error('Failed to create new week:', error)
    toast.error('Failed to create new week.')
  }
}

const deleteCurrentWeek = async () => {
  try {
    await schedulerStore.deleteCurrentWeek()
    toast.success('Week deleted successfully!')
  } catch (error) {
    console.error('Failed to delete week:', error)
    toast.error('Failed to delete week.')
  }
}

const saveNotes = async () => {
  try {
    await schedulerStore.saveNotes()
    toast.success('Notes saved successfully!')
  } catch (error) {
    console.error('Failed to save notes:', error)
    toast.error('Failed to save notes.')
  }
}

const showTaskSelector = (day: number, timeSlot: TimeSlot) => {
  selectedDay.value = day
  selectedTimeSlot.value = timeSlot
  showTaskModal.value = true
}

const selectTask = (taskType: TaskType) => {
  if (!canScheduleTask(taskType, selectedDay.value, selectedTimeSlot.value)) {
    toast.error('Cannot schedule this task at this time.')
    return
  }

  const success = scheduleTask(taskType, selectedDay.value, selectedTimeSlot.value)
  if (success) {
    toast.success('Task scheduled successfully!')
    showTaskModal.value = false
  } else {
    toast.error('Failed to schedule task.')
  }
}

const canAddToDay = (dayIndex: number) => {
  if (!currentWeek.value) return false
  const day = currentWeek.value.days[dayIndex]
  return day.totalUnits < 3
}

const getTaskColor = (taskType: TaskType) => {
  const task = taskDefinitions.value.find(t => t.type === taskType)
  return task?.color || '#666'
}

const getTaskName = (taskType: TaskType) => {
  const task = taskDefinitions.value.find(t => t.type === taskType)
  return task?.name || taskType
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(async () => {
  try {
    await schedulerStore.loadCurrentSchedulerState()
  } catch (error) {
    console.error('Failed to load scheduler state:', error)
  }
})
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 12px;
}

.no-schedule {
  margin-top: 40px;
}

.scheduler-content {
  margin-top: 20px;
}

.week-summary {
  margin-bottom: 30px;
}

.summary-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
}

.stat-value.used {
  color: #a855f7;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 16px;
  margin-top: 20px;
}

.day-column {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 16px;
  min-height: 500px;
}

.day-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #404040;
}

.day-name {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #e0e0e0;
}

.day-units {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.units-label {
  color: #666;
}

.units-value {
  font-weight: 600;
  color: #18a058;
}

.units-value.full {
  color: #f59e0b;
}

.time-slots {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.time-slot {
  background: #1a1a1a;
  border-radius: 6px;
  padding: 12px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.slot-name {
  font-weight: 500;
  color: #e0e0e0;
}

.slot-units {
  font-size: 12px;
  color: #666;
}

.scheduled-task {
  flex: 1;
  border: 2px solid;
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  min-height: 100px;
}

.task-name {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
}

.task-units {
  font-size: 12px;
  color: #666;
}

.task-notes {
  width: 100%;
  margin-top: 8px;
}

.task-notes :deep(.n-input) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.task-notes :deep(.n-input__textarea-el) {
  color: #e0e0e0;
  font-size: 12px;
}

.task-notes :deep(.n-input__textarea-el::placeholder) {
  color: #888;
}

.add-task-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slot-unavailable {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.unavailable-text {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.task-selector {
  padding: 20px 0;
}

.modal-info {
  margin-bottom: 16px;
}

.modal-info p {
  margin: 8px 0;
  color: #e0e0e0;
}

.available-tasks h4 {
  margin: 0 0 16px 0;
  color: #e0e0e0;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-option {
  border: 1px solid #404040;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-option:hover:not(.disabled) {
  border-color: #18a058;
  background: #1a1a1a;
}

.task-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.task-option-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.task-emoji {
  font-size: 20px;
}

.task-option-name {
  flex: 1;
  font-weight: 500;
  color: #e0e0e0;
}

.task-option-units {
  font-size: 12px;
  color: #666;
  background: #404040;
  padding: 2px 8px;
  border-radius: 4px;
}

.task-option-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* Responsive design */
@media (max-width: 1200px) {
  .week-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .week-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-stats {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .week-grid {
    grid-template-columns: 1fr;
  }
}
</style>
