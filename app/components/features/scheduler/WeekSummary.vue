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
      <div class="stats-row">
        <div class="stat">
          <span class="stat-label">Week Starting</span>
          <span class="stat-value">{{ formatDate(week.weekStartDate) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Scheduled</span>
          <span class="stat-value">{{ week.totalScheduledUnits }}/21 units</span>
        </div>
        <div class="stat">
          <span class="stat-label">Free Time Used</span>
          <span class="stat-value">{{ week.freeTimeUsed ? 'Yes' : 'No' }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.stats-row {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-muted-foreground);
}

.stat-value {
  font-size: 0.9375rem;
  font-weight: 500;
}
</style>
