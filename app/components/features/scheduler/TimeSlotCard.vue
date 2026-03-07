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
  <div class="rounded-md bg-background p-3 min-h-[120px] flex flex-col">
    <div class="flex justify-between items-center mb-2 text-sm">
      <span class="font-medium">{{ slotName }}</span>
      <span class="text-xs text-muted-foreground">1 unit</span>
    </div>

    <div v-if="task" class="flex-1 rounded border-2 p-2 flex flex-col items-center text-center" :style="{ borderColor: getTaskColor(task.type, taskDefinitions) }">
      <div class="font-medium text-sm">{{ getTaskName(task.type, taskDefinitions) }}</div>
      <div class="text-xs text-muted-foreground">{{ task.timeUnits }} unit(s)</div>
      <div class="w-full mt-2">
        <Textarea
          :model-value="task.notes || ''"
          placeholder="Add notes..."
          :rows="2"
          class="text-xs bg-background/50"
          @update:model-value="emit('updateNotes', $event as string)"
        />
      </div>
    </div>

    <div v-else-if="canAdd" class="flex-1 flex items-center justify-center">
      <Button size="sm" @click="emit('addTask')">
        <Plus class="h-3 w-3 mr-1" />
        Add Task
      </Button>
    </div>

    <div v-else class="flex-1 flex items-center justify-center opacity-50">
      <span class="text-xs text-muted-foreground italic">Unavailable</span>
    </div>
  </div>
</template>
