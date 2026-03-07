<script setup lang="ts">
import NavBar from './NavBar.vue'
import { Toaster } from '@/components/ui/toast'
import ConfirmDialog from './ConfirmDialog.vue'
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <NavBar />
    <main class="mx-auto max-w-7xl px-4 py-6">
      <slot />
    </main>
    <Toaster />
    <ConfirmDialog />
  </div>
</template>
