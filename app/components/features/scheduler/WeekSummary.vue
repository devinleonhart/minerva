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
    <CardContent>
      <div>
        <div>
          <span>Week Starting</span>
          <span>{{ formatDate(week.weekStartDate) }}</span>
        </div>
        <div>
          <span>Total Scheduled</span>
          <span>{{ week.totalScheduledUnits }}/21 units</span>
        </div>
        <div>
          <span>Free Time Used</span>
          <span>{{ week.freeTimeUsed ? 'Yes' : 'No' }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
