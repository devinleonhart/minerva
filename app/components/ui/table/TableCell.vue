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
