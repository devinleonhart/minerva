<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="dialog-header" :class="props.class">
    <slot />
  </div>
</template>

<style scoped>
.dialog-header {
  padding: 1.375rem 1.375rem 1rem;
}
</style>
