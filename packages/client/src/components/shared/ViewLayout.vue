<template>
  <div class="view-layout">
    <slot />
  </div>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.view-layout {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

@media (max-width: 768px) {
  .view-layout {
    padding: 16px;
  }
}
</style>
