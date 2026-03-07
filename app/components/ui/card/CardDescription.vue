<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <p class="card-desc" :class="props.class">
    <slot />
  </p>
</template>

<style scoped>
.card-desc {
  font-size: 0.875rem;
  color: var(--color-muted-foreground);
  margin: 0.25rem 0 0;
  line-height: 1.4;
}
</style>
