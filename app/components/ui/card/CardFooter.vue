<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="card-footer" :class="props.class">
    <slot />
  </div>
</template>

<style scoped>
.card-footer {
  padding: 1rem 1.375rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
