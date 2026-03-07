<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <thead :class="props.class">
    <slot />
  </thead>
</template>

<style scoped>
thead {
  background-color: color-mix(in srgb, var(--color-card) 60%, var(--color-background));
  border-bottom: 1px solid var(--color-border);
}
</style>
