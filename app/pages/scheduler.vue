<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import type { TaskType, TimeSlot } from '@/types/store/scheduler'
import { PageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import {
  WeekSummary,
  DayColumn,
  TaskSelectorModal
} from '@/components/features/scheduler'
import { Plus, Trash2, Undo2, Save } from 'lucide-vue-next'

const schedulerStore = useSchedulerStore()
const { currentWeek, taskDefinitions } = storeToRefs(schedulerStore)
const toast = useToast()
const confirm = useConfirm()

const showTaskModal = ref(false)
const selectedDay = ref(0)
const selectedTimeSlot = ref<TimeSlot>('MORNING')

const selectedDayName = computed(() => {
  if (!currentWeek.value) return ''
  return currentWeek.value.days[selectedDay.value]?.dayName || ''
})

const availableTasks = computed(() => {
  if (!currentWeek.value) return []
  return schedulerStore.getAvailableTasks(selectedDay.value)
})

const canRemoveTask = computed(() => {
  if (!currentWeek.value) return false
  return currentWeek.value.totalScheduledUnits > 0
})

function canAddToDay(dayIndex: number): boolean {
  if (!currentWeek.value) return false
  return currentWeek.value.days[dayIndex]!.totalUnits < 3
}

function canScheduleTask(taskType: TaskType): boolean {
  return schedulerStore.canScheduleTask(taskType, selectedDay.value, selectedTimeSlot.value)
}

onMounted(async () => {
  try {
    await schedulerStore.loadCurrentSchedulerState()
  } catch {
    toast.error('Failed to load scheduler')
  }
})

async function handleNewWeek() {
  try {
    await schedulerStore.initializeWeek()
    toast.success('New week created')
  } catch {
    toast.error('Failed to create new week')
  }
}

async function handleDeleteWeek() {
  const confirmed = await confirm.confirm({
    title: 'Delete Week',
    message: 'Are you sure you want to delete this week schedule?',
    confirmText: 'Delete',
    variant: 'destructive'
  })

  if (!confirmed) return

  try {
    await schedulerStore.deleteCurrentWeek()
    toast.success('Week deleted')
  } catch {
    toast.error('Failed to delete week')
  }
}

async function handleRemoveLastTask() {
  const success = schedulerStore.removeLastTask()
  if (success) {
    toast.success('Task removed')
  } else {
    toast.error('No tasks to remove')
  }
}

async function handleSaveNotes() {
  try {
    await schedulerStore.saveNotes()
    toast.success('Notes saved')
  } catch {
    toast.error('Failed to save notes')
  }
}

function handleAddTask(dayIndex: number, timeSlot: TimeSlot) {
  selectedDay.value = dayIndex
  selectedTimeSlot.value = timeSlot
  showTaskModal.value = true
}

function handleSelectTask(taskType: TaskType) {
  const success = schedulerStore.scheduleTask(taskType, selectedDay.value, selectedTimeSlot.value)
  if (success) {
    toast.success('Task scheduled')
  } else {
    toast.error('Failed to schedule task')
  }
}

function handleUpdateNotes(dayIndex: number, timeSlot: TimeSlot, notes: string) {
  if (!currentWeek.value) return
  const day = currentWeek.value.days[dayIndex]!
  const slotKey = timeSlot.toLowerCase() as 'morning' | 'afternoon' | 'evening'
  const task = day[slotKey]
  if (task && typeof task === 'object' && 'notes' in task) {
    task.notes = notes
  }
}
</script>

<template>
  <PageLayout title="Scheduler" description="That's it! Now I'm mad!">
    <template #actions>
      <div>
        <Button @click="handleNewWeek" :disabled="!!currentWeek">
          <Plus />
          New Week
        </Button>
        <Button variant="outline" @click="handleRemoveLastTask" :disabled="!canRemoveTask">
          <Undo2 />
          Remove Last
        </Button>
        <Button v-if="currentWeek" variant="outline" @click="handleSaveNotes">
          <Save />
          Save Notes
        </Button>
        <Button v-if="currentWeek" variant="destructive" @click="handleDeleteWeek">
          <Trash2 />
          Delete Week
        </Button>
      </div>
    </template>

    <div v-if="!currentWeek">
      No week schedule created yet. Click "New Week" to get started!
    </div>

    <div v-else>
      <WeekSummary :week="currentWeek" />

      <div>
        <DayColumn
          v-for="(day, index) in currentWeek.days"
          :key="day.day"
          :day="day"
          :day-index="index"
          :task-definitions="taskDefinitions"
          :can-add="canAddToDay(index)"
          @add-task="handleAddTask"
          @update-notes="handleUpdateNotes"
        />
      </div>
    </div>

    <TaskSelectorModal
      :open="showTaskModal"
      :day-name="selectedDayName"
      :time-slot="selectedTimeSlot"
      :available-units="schedulerStore.getRemainingTimeUnits(selectedDay)"
      :tasks="availableTasks"
      :can-schedule="canScheduleTask"
      @update:open="showTaskModal = $event"
      @select="handleSelectTask"
    />
  </PageLayout>
</template>
