<template>
  <div class="card-header">
    <h3 class="card-title">{{ title }}</h3>
    <div class="card-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { CardHeaderProps } from '@/types/components'

defineProps<CardHeaderProps>()
</script>

<style scoped>
.card-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: #e0e0e0;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Responsive design for small screens */
@media (max-width: 768px) {
  .card-actions {
    justify-content: flex-start;
  }
}
</style>
