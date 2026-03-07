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
