<script setup lang="ts">
import type { ScheduledTask } from '@/types/store/scheduler'
import type { SlotState } from '@/lib/schedulerMeta'
import { TASK_META } from '@/lib/schedulerMeta'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X } from 'lucide-vue-next'

interface Props {
  slotName: string
  state: SlotState
}

defineProps<Props>()

const emit = defineEmits<{
  addTask: []
  removeTask: [taskId: number]
  updateNotes: [taskId: number, notes: string]
}>()

function taskMeta(task: ScheduledTask) {
  return TASK_META[task.type]
}
</script>

<template>
  <div class="slot">
    <div class="slot-header">
      <span class="slot-name">{{ slotName }}</span>
    </div>

    <div
      v-if="state.kind === 'task'"
      class="slot-task"
      :style="{ borderLeftColor: taskMeta(state.task).color }"
    >
      <div class="task-top">
        <span class="task-label">{{ taskMeta(state.task).emoji }} {{ taskMeta(state.task).label }}</span>
        <Button variant="ghost" size="icon" class="remove-btn" @click="emit('removeTask', state.task.id)">
          <X />
        </Button>
      </div>
      <Textarea
        :model-value="state.task.notes ?? ''"
        placeholder="Notes..."
        :rows="2"
        @change="emit('updateNotes', state.task.id, ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div
      v-else-if="state.kind === 'continuation'"
      class="slot-continuation"
      :style="{ borderLeftColor: taskMeta(state.sourceTask).color }"
    >
      <span>↑ {{ taskMeta(state.sourceTask).label }}</span>
    </div>

    <div v-else class="slot-empty">
      <Button size="sm" variant="ghost" @click="emit('addTask')">
        <Plus />
        Add Task
      </Button>
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
  padding: 0.4375rem 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
}

.slot-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted-foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.slot-task {
  padding: 0.5rem 0.75rem;
  border-left: 3px solid var(--color-primary);
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.task-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
}

.task-label {
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.3;
}

.remove-btn {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-muted-foreground);
}

.slot-continuation {
  padding: 0.625rem 0.75rem;
  border-left: 3px solid var(--color-primary);
  font-size: 0.8125rem;
  color: var(--color-muted-foreground);
  font-style: italic;
}

.slot-empty {
  padding: 0.375rem 0.5rem;
}
</style>
