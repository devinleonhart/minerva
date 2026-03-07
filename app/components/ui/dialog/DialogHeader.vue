<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="props.class">
    <slot />
  </div>
</template>
