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
  <div class="rounded-lg bg-card p-4 min-h-[500px]">
    <div class="text-center mb-4 pb-3 border-b">
      <h3 class="font-semibold text-lg">{{ day.dayName }}</h3>
      <div class="flex justify-center items-center gap-2 text-sm mt-1">
        <span class="text-muted-foreground">Units:</span>
        <span class="font-semibold" :class="day.totalUnits === 3 ? 'text-amber-500' : 'text-green-500'">
          {{ day.totalUnits }}/3
        </span>
      </div>
    </div>

    <div class="space-y-3">
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
