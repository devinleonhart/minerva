<script setup lang="ts">
import { Label } from 'radix-vue'

interface Props {
  for?: string
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <Label class="label" :for="props.for" :class="props.class">
    <slot />
  </Label>
</template>

<style scoped>
.label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  cursor: pointer;
}
</style>
