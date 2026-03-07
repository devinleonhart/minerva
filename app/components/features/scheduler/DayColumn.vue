<script setup lang="ts">
import type { DaySchedule, TimeSlot } from '@/types/store/scheduler'
import { getSlotState } from '@/lib/schedulerMeta'
import TimeSlotCard from './TimeSlotCard.vue'

interface Props {
  day: DaySchedule
}

defineProps<Props>()

const emit = defineEmits<{
  addTask: [day: number, timeSlot: TimeSlot]
  removeTask: [taskId: number]
  updateNotes: [taskId: number, notes: string]
}>()

function fwdNotes(taskId: number, notes: string) {
  emit('updateNotes', taskId, notes)
}
</script>

<template>
  <div class="day-col">
    <div class="day-header">
      <span class="day-name">{{ day.dayName.slice(0, 3) }}</span>
    </div>

    <div class="day-slots">
      <TimeSlotCard
        slot-name="Morning"
        :state="getSlotState(day.tasks, 'MORNING')"
        @add-task="emit('addTask', day.day, 'MORNING')"
        @remove-task="emit('removeTask', $event)"
        @update-notes="fwdNotes"
      />
      <TimeSlotCard
        slot-name="Afternoon"
        :state="getSlotState(day.tasks, 'AFTERNOON')"
        @add-task="emit('addTask', day.day, 'AFTERNOON')"
        @remove-task="emit('removeTask', $event)"
        @update-notes="fwdNotes"
      />
      <TimeSlotCard
        slot-name="Evening"
        :state="getSlotState(day.tasks, 'EVENING')"
        @add-task="emit('addTask', day.day, 'EVENING')"
        @remove-task="emit('removeTask', $event)"
        @update-notes="fwdNotes"
      />
    </div>
  </div>
</template>

<style scoped>
.day-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.day-header {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  background-color: color-mix(in srgb, var(--color-card) 60%, var(--color-background));
}

.day-name {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted-foreground);
}

.day-slots {
  display: flex;
  flex-direction: column;
  flex: 1;
}
</style>
