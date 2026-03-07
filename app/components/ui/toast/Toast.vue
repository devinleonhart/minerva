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
    :open="open"
    :class="props.class"
    @update:open="emit('update:open', $event)"
  >
    <div>
      <ToastTitle v-if="title">{{ title }}</ToastTitle>
      <ToastDescription v-if="description">{{ description }}</ToastDescription>
      <slot />
    </div>
    <ToastClose>
      <X />
    </ToastClose>
  </ToastRoot>
</template>
