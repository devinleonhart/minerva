<script setup lang="ts">
interface Props {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  disabled: false,
  type: 'button'
})
</script>

<template>
  <button :type="type" :class="props.class" :disabled="disabled">
    <slot />
  </button>
</template>
