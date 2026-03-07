<script setup lang="ts">
import { ToastRoot, ToastTitle, ToastDescription, ToastClose } from 'radix-vue'
import { X } from 'lucide-vue-next'

interface Props {
  variant?: 'default' | 'success' | 'destructive'
  title?: string
  description?: string
  open?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  open: true
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<template>
  <ToastRoot
    class="toast"
    :class="[`toast-${variant}`, props.class]"
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <div class="toast-body">
      <ToastTitle v-if="title" class="toast-title">{{ title }}</ToastTitle>
      <ToastDescription v-if="description" class="toast-description">{{ description }}</ToastDescription>
      <slot />
    </div>
    <ToastClose class="toast-close">
      <X />
    </ToastClose>
  </ToastRoot>
</template>
