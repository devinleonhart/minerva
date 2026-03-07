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
  <div>
    <div>
      <h3>{{ day.dayName }}</h3>
      <div>
        <span>Units:</span>
        <span>{{ day.totalUnits }}/3</span>
      </div>
    </div>

    <div>
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
