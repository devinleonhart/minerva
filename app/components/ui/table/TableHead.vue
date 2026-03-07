<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <th :class="props.class">
    <slot />
  </th>
</template>
