<script setup lang="ts">
import { DialogTitle } from 'radix-vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <DialogTitle class="dialog-title" :class="props.class">
    <slot />
  </DialogTitle>
</template>

<style scoped>
.dialog-title {
  font-size: 1.0625rem;
  font-weight: 600;
  margin: 0;
  padding-right: 2rem;
  line-height: 1.3;
}
</style>
