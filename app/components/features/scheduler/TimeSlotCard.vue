<script setup lang="ts">
import type { ScheduledTask, TaskDefinition } from '@/types/store/scheduler'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-vue-next'

interface Props {
  slotName: string
  task?: ScheduledTask
  taskDefinitions: TaskDefinition[]
  canAdd: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  addTask: []
  updateNotes: [notes: string]
}>()

function getTaskColor(type: string, definitions: TaskDefinition[]): string {
  return definitions.find(t => t.type === type)?.color || '#666'
}

function getTaskName(type: string, definitions: TaskDefinition[]): string {
  return definitions.find(t => t.type === type)?.name || type
}
</script>

<template>
  <div class="slot">
    <div class="slot-header">
      <span class="slot-name">{{ slotName }}</span>
      <span class="slot-unit">1 unit</span>
    </div>

    <div
      v-if="task"
      class="slot-task"
      :style="{ borderLeftColor: getTaskColor(task.type, taskDefinitions) }"
    >
      <div class="task-name">{{ getTaskName(task.type, taskDefinitions) }}</div>
      <div class="task-units">{{ task.timeUnits }} unit(s)</div>
      <Textarea
        :model-value="task.notes || ''"
        placeholder="Add notes..."
        :rows="2"
        @update:model-value="emit('updateNotes', $event as string)"
      />
    </div>

    <div v-else-if="canAdd" class="slot-empty">
      <Button size="sm" variant="ghost" @click="emit('addTask')">
        <Plus />
        Add Task
      </Button>
    </div>

    <div v-else class="slot-unavailable">
      <span>Unavailable</span>
    </div>
  </div>
</template>

<style scoped>
.slot {
  border-bottom: 1px solid var(--color-border);
}

.slot:last-child {
  border-bottom: none;
}

.slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
}

.slot-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.slot-unit {
  font-size: 0.75rem;
  color: var(--color-muted-foreground);
}

.slot-task {
  padding: 0.625rem 0.75rem;
  border-left: 3px solid var(--color-primary);
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.task-name {
  font-size: 0.875rem;
  font-weight: 500;
}

.task-units {
  font-size: 0.75rem;
  color: var(--color-muted-foreground);
}

.slot-empty {
  padding: 0.5rem 0.75rem;
  display: flex;
}

.slot-unavailable {
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-muted-foreground);
  font-style: italic;
}
</style>
