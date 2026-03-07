<template>
  <AppLayout>
    <NuxtPage />
  </AppLayout>
</template>

<script lang="ts" setup>
import { AppLayout } from '@/components/layout'
</script>

<style>
#app {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

body {
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}
</style>
