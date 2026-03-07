<script setup lang="ts">
import { Label } from 'radix-vue'

interface Props {
  for?: string
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <Label :for="props.for" :class="props.class">
    <slot />
  </Label>
</template>
