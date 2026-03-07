<script setup lang="ts">
import NavBar from './NavBar.vue'
import { Toaster } from '@/components/ui/toast'
import ConfirmDialog from './ConfirmDialog.vue'
</script>

<template>
  <div class="app">
    <NavBar />
    <main class="app-main">
      <slot />
    </main>
    <Toaster />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
}
</style>
