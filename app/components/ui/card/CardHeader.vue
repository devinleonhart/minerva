<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="card-header" :class="props.class">
    <slot />
  </div>
</template>

<style scoped>
.card-header {
  padding: 1.125rem 1.375rem;
  border-bottom: 1px solid var(--color-border);
}
</style>
