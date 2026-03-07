<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay } from 'radix-vue'

interface Props {
  open?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <slot />
    <DialogPortal>
      <DialogOverlay class="dialog-overlay" />
      <slot name="content" />
    </DialogPortal>
  </DialogRoot>
</template>
