<template>
    <div>
        <form @submit.prevent="handleSubmit">
            <label for="csvInput">CSV Input</label>
            <textarea name="csvInput" id="csvInput" v-model="inputText"></textarea>
            <button type="submit">Import</button>
        </form>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useIngredientStore } from '@/store/ingredient'
import csvToIngredients from '@/utils/csvToIngredients'

import type { Prisma } from '#/prisma-types'

const ingredientStore = useIngredientStore()
const inputText = ref('')
const ingredients = ref<Prisma.IngredientCreateInput[]>([])

const handleSubmit = () => {
  try {
    ingredients.value = csvToIngredients(inputText.value)
  } catch (error) {
    console.error(error)
  }

  ingredients.value.forEach(ingredient => {
    ingredientStore.addIngredient(ingredient)
  })
}
</script>
