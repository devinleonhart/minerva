<script setup lang="ts">
interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div>
    <table :class="props.class">
      <slot />
    </table>
  </div>
</template>
