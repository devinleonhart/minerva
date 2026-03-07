<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <h3 class="card-title" :class="props.class">
    <slot />
  </h3>
</template>

<style scoped>
.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
}
</style>
