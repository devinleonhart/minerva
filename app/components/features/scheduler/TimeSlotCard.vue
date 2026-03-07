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
  <div>
    <div>
      <span>{{ slotName }}</span>
      <span>1 unit</span>
    </div>

    <div v-if="task" :style="{ borderColor: getTaskColor(task.type, taskDefinitions) }">
      <div>{{ getTaskName(task.type, taskDefinitions) }}</div>
      <div>{{ task.timeUnits }} unit(s)</div>
      <div>
        <Textarea
          :model-value="task.notes || ''"
          placeholder="Add notes..."
          :rows="2"
          @update:model-value="emit('updateNotes', $event as string)"
        />
      </div>
    </div>

    <div v-else-if="canAdd">
      <Button size="sm" @click="emit('addTask')">
        <Plus />
        Add Task
      </Button>
    </div>

    <div v-else>
      <span>Unavailable</span>
    </div>
  </div>
</template>
