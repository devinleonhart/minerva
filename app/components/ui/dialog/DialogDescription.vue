<script setup lang="ts">
import { DialogDescription } from 'radix-vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <DialogDescription class="dialog-desc" :class="props.class">
    <slot />
  </DialogDescription>
</template>

<style scoped>
.dialog-desc {
  font-size: 0.875rem;
  color: var(--color-muted-foreground);
  margin: 0.375rem 0 0;
  line-height: 1.5;
}
</style>
