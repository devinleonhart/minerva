<template>
  <div class="grid-layout" :class="[`grid-${variant}`, { 'empty-state': isEmpty }]">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import type { GridLayoutProps } from '@/types/components'

withDefaults(defineProps<GridLayoutProps>(), {
  variant: 'default',
  isEmpty: false
})
</script>

<style scoped>
.grid-layout {
  display: grid;
  gap: 20px;
  margin-top: 20px;
}

.grid-default {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.grid-compact {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.grid-wide {
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.empty-state {
  margin-top: 20px;
}
</style>
