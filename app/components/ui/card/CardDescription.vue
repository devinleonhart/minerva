<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <p :class="props.class">
    <slot />
  </p>
</template>
