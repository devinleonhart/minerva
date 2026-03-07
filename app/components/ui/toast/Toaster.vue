<script setup lang="ts">
import { ToastProvider, ToastViewport } from 'radix-vue'
import Toast from './Toast.vue'
import { useToast } from '@/composables/useToast'

const { toasts, dismissToast } = useToast()
</script>

<template>
  <ToastProvider>
    <Toast
      v-for="toast in toasts"
      :key="toast.id"
      :variant="toast.variant"
      :title="toast.title"
      :description="toast.description"
      :open="toast.open"
      @update:open="dismissToast(toast.id)"
    />
    <ToastViewport class="toast-viewport" />
  </ToastProvider>
</template>
