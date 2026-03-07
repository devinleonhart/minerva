<script setup lang="ts">
import type { TaskType, TaskDefinition, TimeSlot } from '@/types/store/scheduler'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  open: boolean
  dayName: string
  timeSlot: TimeSlot
  availableUnits: number
  tasks: TaskDefinition[]
  canSchedule: (taskType: TaskType) => boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [taskType: TaskType]
}>()

function handleSelect(taskType: TaskType) {
  if (!props.canSchedule(taskType)) return
  emit('select', taskType)
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Task</DialogTitle>
        </DialogHeader>

        <div class="space-y-4">
          <div class="flex gap-4 text-sm">
            <div><span class="text-muted-foreground">Day:</span> <span class="font-medium">{{ dayName }}</span></div>
            <div><span class="text-muted-foreground">Time:</span> <span class="font-medium">{{ timeSlot }}</span></div>
            <div><span class="text-muted-foreground">Available:</span> <span class="font-medium">{{ availableUnits }} units</span></div>
          </div>

          <div class="space-y-2">
            <h4 class="font-medium">Available Tasks:</h4>
            <div class="space-y-2 max-h-[300px] overflow-y-auto">
              <Card
                v-for="task in tasks"
                :key="task.type"
                class="p-3 cursor-pointer transition-colors"
                :class="canSchedule(task.type) ? 'hover:border-primary' : 'opacity-50 cursor-not-allowed'"
                @click="handleSelect(task.type)"
              >
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: task.color }" />
                  <div class="flex-1">
                    <div class="font-medium">{{ task.name }}</div>
                    <div class="text-xs text-muted-foreground">{{ task.description }}</div>
                  </div>
                  <Badge variant="secondary">{{ task.timeUnits }} unit(s)</Badge>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="emit('update:open', false)">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </template>
  </Dialog>
</template>
