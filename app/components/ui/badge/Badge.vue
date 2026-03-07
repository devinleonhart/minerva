<script setup lang="ts">
interface Props {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})
</script>

<template>
  <div :class="props.class">
    <slot />
  </div>
</template>
