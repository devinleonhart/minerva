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
    <ToastViewport class="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
  </ToastProvider>
</template>
