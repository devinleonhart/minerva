<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <td :class="props.class">
    <slot />
  </td>
</template>

<style scoped>
td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
}
</style>
