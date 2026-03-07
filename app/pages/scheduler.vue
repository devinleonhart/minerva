<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import type { TimeSlot, TaskType } from '@/types/store/scheduler'
import { PageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { DayColumn, TaskSelectorModal } from '@/components/features/scheduler'
import { Plus, Trash2, Loader2 } from 'lucide-vue-next'

const schedulerStore = useSchedulerStore()
const { week } = storeToRefs(schedulerStore)
const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const showTaskModal = ref(false)
const selectedDay = ref(0)
const selectedSlot = ref<TimeSlot>('MORNING')

onMounted(async () => {
  isLoading.value = true
  try {
    await schedulerStore.loadWeek()
  } catch {
    toast.error('Failed to load schedule')
  } finally {
    isLoading.value = false
  }
})

async function handleNewWeek() {
  try {
    await schedulerStore.createWeek()
    toast.success('New week created')
  } catch {
    toast.error('Failed to create week')
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
    await schedulerStore.deleteWeek()
    toast.success('Week deleted')
  } catch {
    toast.error('Failed to delete week')
  }
}

function handleOpenTaskModal(day: number, slot: TimeSlot) {
  selectedDay.value = day
  selectedSlot.value = slot
  showTaskModal.value = true
}

async function handleSelectTask(taskType: TaskType) {
  if (!week.value) return
  try {
    await schedulerStore.addTask(week.value.id, selectedDay.value, selectedSlot.value, taskType)
  } catch {
    toast.error('Failed to add task')
  }
}

async function handleRemoveTask(taskId: number) {
  try {
    await schedulerStore.removeTask(taskId)
  } catch {
    toast.error('Failed to remove task')
  }
}

async function handleUpdateNotes(taskId: number, notes: string) {
  try {
    await schedulerStore.updateTaskNotes(taskId, notes)
  } catch {
    toast.error('Failed to save notes')
  }
}
</script>

<template>
  <PageLayout title="Scheduler" description="That's it! Now I'm mad!">
    <template #actions>
      <div class="action-bar">
        <Button v-if="!week" @click="handleNewWeek">
          <Plus />
          New Week
        </Button>
        <Button v-if="week" variant="destructive" @click="handleDeleteWeek">
          <Trash2 />
          Delete Week
        </Button>
      </div>
    </template>

    <div v-if="isLoading" class="loading-center">
      <Loader2 />
    </div>

    <div v-else-if="!week" class="empty-state">
      No week schedule yet. Click "New Week" to get started.
    </div>

    <div v-else class="week-grid">
      <DayColumn
        v-for="day in week.days"
        :key="day.day"
        :day="day"
        @add-task="handleOpenTaskModal"
        @remove-task="handleRemoveTask"
        @update-notes="handleUpdateNotes"
      />
    </div>

    <TaskSelectorModal
      v-if="week"
      :open="showTaskModal"
      :day-name="week.days[selectedDay]?.dayName ?? ''"
      :time-slot="selectedSlot"
      :tasks="week.days[selectedDay]?.tasks ?? { MORNING: null, AFTERNOON: null, EVENING: null }"
      @update:open="showTaskModal = $event"
      @select="handleSelectTask"
    />
  </PageLayout>
</template>

<style scoped>
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.week-grid > * {
  border-right: 1px solid var(--color-border);
}

.week-grid > *:last-child {
  border-right: none;
}
</style>
