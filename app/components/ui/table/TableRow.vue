<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <tr :class="props.class">
    <slot />
  </tr>
</template>

<style scoped>
tr {
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.1s;
}

tr:last-child {
  border-bottom: none;
}

tr:hover {
  background-color: color-mix(in srgb, var(--color-accent) 50%, transparent);
}
</style>
