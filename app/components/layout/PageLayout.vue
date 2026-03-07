<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <div>
    <div>
      <div>
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </div>
      <div>
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </div>
</template>
