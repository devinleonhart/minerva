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

        <div class="modal-body">
          <div class="context-info">
            <div class="context-item"><span class="context-label">Day</span><span>{{ dayName }}</span></div>
            <div class="context-item"><span class="context-label">Time</span><span>{{ timeSlot }}</span></div>
            <div class="context-item"><span class="context-label">Available</span><span>{{ availableUnits }} units</span></div>
          </div>

          <div class="task-list">
            <Card
              v-for="task in tasks"
              :key="task.type"
              :class="'task-card' + (!canSchedule(task.type) ? ' disabled' : '')"
              @click="handleSelect(task.type)"
            >
              <div class="task-card-inner">
                <div class="task-color-dot" :style="{ backgroundColor: task.color }" />
                <div class="info-cell">
                  <div class="name">{{ task.name }}</div>
                  <div class="sub">{{ task.description }}</div>
                </div>
                <Badge variant="secondary">{{ task.timeUnits }} unit(s)</Badge>
              </div>
            </Card>
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

<style scoped>
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1.375rem;
}

.context-info {
  display: flex;
  gap: 1.5rem;
  padding: 0.625rem 0.75rem;
  background-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.context-item {
  display: flex;
  flex-direction: column;
  gap: 0.0625rem;
}

.context-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-muted-foreground);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.task-card {
  cursor: pointer;
  transition: border-color 0.15s;
}

.task-card:hover:not(.disabled) {
  border-color: var(--color-primary);
}

.task-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.task-card-inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.875rem;
}

.task-color-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
