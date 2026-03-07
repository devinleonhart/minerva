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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Task</DialogTitle>
        </DialogHeader>

        <div>
          <div>
            <div><span>Day:</span> <span>{{ dayName }}</span></div>
            <div><span>Time:</span> <span>{{ timeSlot }}</span></div>
            <div><span>Available:</span> <span>{{ availableUnits }} units</span></div>
          </div>

          <div>
            <h4>Available Tasks:</h4>
            <div>
              <Card
                v-for="task in tasks"
                :key="task.type"
                :style="{ cursor: canSchedule(task.type) ? 'pointer' : 'not-allowed' }"
                @click="handleSelect(task.type)"
              >
                <div>
                  <div :style="{ backgroundColor: task.color }" />
                  <div>
                    <div>{{ task.name }}</div>
                    <div>{{ task.description }}</div>
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
