<script setup lang="ts">
import { computed } from 'vue'
import { ToastRoot, ToastTitle, ToastDescription, ToastClose, ToastAction } from 'radix-vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

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

const variantClasses = {
  default: 'border bg-background text-foreground',
  success: 'border-green-500/50 bg-green-950 text-green-50',
  destructive: 'border-destructive/50 bg-destructive text-destructive-foreground'
}

const toastClass = computed(() =>
  cn(
    'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
    variantClasses[props.variant],
    props.class
  )
)
</script>

<template>
  <ToastRoot
    :open="open"
    :class="toastClass"
    @update:open="emit('update:open', $event)"
  >
    <div class="grid gap-1">
      <ToastTitle v-if="title" class="text-sm font-semibold">
        {{ title }}
      </ToastTitle>
      <ToastDescription v-if="description" class="text-sm opacity-90">
        {{ description }}
      </ToastDescription>
      <slot />
    </div>
    <ToastClose class="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
      <X class="h-4 w-4" />
    </ToastClose>
  </ToastRoot>
</template>
