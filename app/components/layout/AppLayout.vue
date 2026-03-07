<script setup lang="ts">
import NavBar from './NavBar.vue'
import { Toaster } from '@/components/ui/toast'
import ConfirmDialog from './ConfirmDialog.vue'
</script>

<template>
  <div>
    <NavBar />
    <main>
      <slot />
    </main>
    <Toaster />
    <ConfirmDialog />
  </div>
</template>
