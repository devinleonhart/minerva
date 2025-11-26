<template>
  <div class="resource-list">
    <slot />
  </div>
</template>

<style scoped>
.resource-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 20px 20px;
}

@media (max-width: 768px) {
  .resource-list {
    padding: 0 12px 16px;
  }
}
</style>
