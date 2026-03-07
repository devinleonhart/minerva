<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  disabled: false,
  type: 'button'
})

const cls = computed(() => [
  'btn',
  `btn-${props.variant}`,
  props.size !== 'default' ? `btn-${props.size}` : '',
  props.class
])
</script>

<template>
  <button :type="type" :class="cls" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.15s, border-color 0.15s, opacity 0.15s;
  white-space: nowrap;
  font-family: inherit;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-default {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
}

.btn-default:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-primary) 85%, black);
}

.btn-destructive {
  background-color: var(--color-destructive);
  color: var(--color-destructive-foreground);
}

.btn-destructive:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-destructive) 85%, black);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-foreground);
  border-color: var(--color-border);
}

.btn-outline:hover:not(:disabled) {
  background-color: var(--color-accent);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: var(--color-secondary-foreground);
  border-color: var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-secondary) 80%, white);
}

.btn-ghost {
  background-color: transparent;
  color: var(--color-foreground);
}

.btn-ghost:hover:not(:disabled) {
  background-color: var(--color-accent);
}

.btn-link {
  background-color: transparent;
  color: var(--color-primary);
  text-decoration: underline;
}

.btn :deep(svg) {
  width: 0.875em;
  height: 0.875em;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-lg {
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
}

.btn-icon {
  padding: 0.5rem;
  width: 2.25rem;
  height: 2.25rem;
}
</style>
