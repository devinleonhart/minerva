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
import { useToast } from '@/composables/useToast'

import type { Prisma } from '#/prisma-types'

const ingredientStore = useIngredientStore()
const toast = useToast()
const inputText = ref('')
const ingredients = ref<Prisma.IngredientCreateInput[]>([])

const handleSubmit = async () => {
  try {
    ingredients.value = csvToIngredients(inputText.value)

    // Import all ingredients
    for (const ingredient of ingredients.value) {
      await ingredientStore.addIngredient(ingredient)
    }

    // Clear the form
    inputText.value = ''
    ingredients.value = []

    toast.success(`Successfully imported ${ingredients.value.length} ingredients!`)
  } catch (error) {
    console.error(error)
    toast.error('Failed to import ingredients. Please check your CSV format and try again.')
  }
}
</script>
