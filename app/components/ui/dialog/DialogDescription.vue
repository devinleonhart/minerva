<script setup lang="ts">
import { DialogDescription } from 'radix-vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <DialogDescription :class="props.class">
    <slot />
  </DialogDescription>
</template>
