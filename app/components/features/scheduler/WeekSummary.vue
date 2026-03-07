<script setup lang="ts">
import type { WeekSchedule } from '@/types/store/scheduler'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  week: WeekSchedule
}

defineProps<Props>()

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <Card>
    <CardContent class="py-4">
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">Week Starting</span>
          <span class="font-semibold">{{ formatDate(week.weekStartDate) }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">Total Scheduled</span>
          <span class="font-semibold">{{ week.totalScheduledUnits }}/21 units</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-muted-foreground">Free Time Used</span>
          <span class="font-semibold" :class="week.freeTimeUsed ? 'text-purple-400' : ''">
            {{ week.freeTimeUsed ? 'Yes' : 'No' }}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
