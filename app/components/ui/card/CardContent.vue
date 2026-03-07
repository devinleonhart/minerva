<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="card-content" :class="props.class">
    <slot />
  </div>
</template>

<style scoped>
.card-content {
  padding: 1.125rem 1.375rem;
}
</style>
