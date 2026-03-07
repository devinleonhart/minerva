<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const cls = computed(() => ['badge', `badge-${props.variant}`, props.class])
</script>

<template>
  <span :class="cls">
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-xl);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.5;
  border: 1px solid transparent;
  white-space: nowrap;
}

.badge-default {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
}

.badge-secondary {
  background-color: var(--color-secondary);
  color: var(--color-secondary-foreground);
  border-color: var(--color-border);
}

.badge-destructive {
  background-color: var(--color-destructive);
  color: var(--color-destructive-foreground);
}

.badge-outline {
  background-color: transparent;
  color: var(--color-foreground);
  border-color: var(--color-border);
}
</style>
