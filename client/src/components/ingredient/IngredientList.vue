<template>
  <ul>
    <li v-for="ingredient in ingredients" :key="ingredient.id">
      {{ ingredient.name }} - {{ ingredient.description }}
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useIngredientStore } from '@/store/ingredient'

const ingredientStore = useIngredientStore()
const { ingredients } = storeToRefs(useIngredientStore())

onMounted(async () => {
  await ingredientStore.getIngredients()
})

</script>
