<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <tbody :class="props.class">
    <slot />
  </tbody>
</template>

<style scoped>
tbody {
  background-color: var(--color-card);
}
</style>
