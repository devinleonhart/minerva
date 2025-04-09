<template>
    <h1>Minerva</h1>
    <ExampleComponent />
  </template>

<script lang="ts" setup>
import { onMounted } from 'vue'

import { getIngredient } from '@/utils/ingredient/get'
import ExampleComponent from '@/components/ExampleComponent.vue'

onMounted(async () => {
  const ingredient = await getIngredient()
  console.log(ingredient)
})
</script>
