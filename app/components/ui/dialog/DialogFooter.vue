<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="dialog-footer" :class="props.class">
    <slot />
  </div>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.375rem 1.375rem;
  border-top: 1px solid var(--color-border);
  margin-top: 1rem;
}
</style>
