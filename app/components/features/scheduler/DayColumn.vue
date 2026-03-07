<script setup lang="ts">
import type { DaySchedule, TaskDefinition, TimeSlot } from '@/types/store/scheduler'
import TimeSlotCard from './TimeSlotCard.vue'

interface Props {
  day: DaySchedule
  dayIndex: number
  taskDefinitions: TaskDefinition[]
  canAdd: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  addTask: [dayIndex: number, timeSlot: TimeSlot]
  updateNotes: [dayIndex: number, timeSlot: TimeSlot, notes: string]
}>()
</script>

<template>
  <div class="day-col">
    <div class="day-header">
      <h3 class="day-name">{{ day.dayName }}</h3>
      <span class="day-units">{{ day.totalUnits }}/3</span>
    </div>

    <div class="day-slots">
      <TimeSlotCard
        slot-name="Morning"
        :task="day.morning"
        :task-definitions="taskDefinitions"
        :can-add="canAdd"
        @add-task="emit('addTask', dayIndex, 'MORNING')"
        @update-notes="(notes) => emit('updateNotes', dayIndex, 'MORNING', notes)"
      />

      <TimeSlotCard
        slot-name="Afternoon"
        :task="day.afternoon"
        :task-definitions="taskDefinitions"
        :can-add="canAdd"
        @add-task="emit('addTask', dayIndex, 'AFTERNOON')"
        @update-notes="(notes) => emit('updateNotes', dayIndex, 'AFTERNOON', notes)"
      />

      <TimeSlotCard
        slot-name="Evening"
        :task="day.evening"
        :task-definitions="taskDefinitions"
        :can-add="canAdd"
        @add-task="emit('addTask', dayIndex, 'EVENING')"
        @update-notes="(notes) => emit('updateNotes', dayIndex, 'EVENING', notes)"
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  background-color: color-mix(in srgb, var(--color-card) 60%, var(--color-background));
}

.day-name {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

.day-units {
  font-size: 0.75rem;
  color: var(--color-muted-foreground);
}

.day-slots {
  display: flex;
  flex-direction: column;
  flex: 1;
}
</style>
