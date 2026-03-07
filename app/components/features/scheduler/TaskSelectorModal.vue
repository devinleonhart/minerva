<script setup lang="ts">
import type { TaskType, TimeSlot, ScheduledTask } from '@/types/store/scheduler'
import { TASK_META, getAvailableTaskTypes } from '@/lib/schedulerMeta'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface Props {
  open: boolean
  dayName: string
  timeSlot: TimeSlot
  tasks: {
    MORNING: ScheduledTask | null
    AFTERNOON: ScheduledTask | null
    EVENING: ScheduledTask | null
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [taskType: TaskType]
}>()

const ALL_TASK_TYPES = Object.keys(TASK_META) as TaskType[]

function availableTypes() {
  return getAvailableTaskTypes(props.tasks, props.timeSlot)
}

function isAvailable(type: TaskType) {
  return availableTypes().includes(type)
}

function handleSelect(type: TaskType) {
  if (!isAvailable(type)) return
  emit('select', type)
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Task — {{ dayName }}, {{ timeSlot.charAt(0) + timeSlot.slice(1).toLowerCase() }}</DialogTitle>
        </DialogHeader>

        <div class="task-list">
          <Card
            v-for="type in ALL_TASK_TYPES"
            :key="type"
            :class="'task-card' + (!isAvailable(type) ? ' disabled' : '')"
            @click="handleSelect(type)"
          >
            <div class="task-card-inner">
              <span class="task-emoji">{{ TASK_META[type].emoji }}</span>
              <div class="info-cell">
                <span class="name">{{ TASK_META[type].label }}</span>
              </div>
              <Badge variant="secondary">{{ TASK_META[type].units }} unit{{ TASK_META[type].units > 1 ? 's' : '' }}</Badge>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="emit('update:open', false)">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </template>
  </Dialog>
</template>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0 1.375rem;
}

.task-card {
  cursor: pointer;
  transition: border-color 0.15s;
}

.task-card:hover:not(.disabled) {
  border-color: var(--color-primary);
}

.task-card.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.task-card-inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
}

.task-emoji {
  font-size: 1.125rem;
  line-height: 1;
  flex-shrink: 0;
}
</style>
