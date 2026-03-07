<script setup lang="ts">
import { DialogTitle } from 'radix-vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <DialogTitle :class="props.class">
    <slot />
  </DialogTitle>
</template>
