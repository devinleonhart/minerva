<template>
  <form @submit.prevent="handleIngredientAdded">
    <div>
      <label for="name">Name:</label>
      <input type="text" id="name" v-model="ingredient.name" required />
    </div>
    <div>
      <label for="description">Description:</label>
      <input type="text" id="description" v-model="ingredient.description" required />
    </div>
    <button type="submit">Add Ingredient</button>
    </form>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useIngredientStore } from '@/store/ingredient'

import type { IngredientForm } from '#/store/ingredient'

const ingredientStore = useIngredientStore()

const ingredient = ref<IngredientForm>({
  name: '',
  description: ''
})

const handleIngredientAdded = async () => {
  if(ingredient.value) {
    await ingredientStore.addIngredient(ingredient.value)
    await ingredientStore.getIngredients()
  }
}
</script>
