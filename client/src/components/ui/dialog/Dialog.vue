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
      <DialogOverlay class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <slot name="content" />
    </DialogPortal>
  </DialogRoot>
</template>
