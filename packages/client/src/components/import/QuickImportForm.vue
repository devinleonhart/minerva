<template>
    <div class="quick-import-view">
        <n-card title="Import Ingredients from CSV" class="import-form-card">
            <n-form @submit.prevent="handleSubmit" label-placement="top">
                <n-form-item label="CSV Input">
                    <n-input
                        v-model:value="inputText"
                        type="textarea"
                        placeholder="Paste your CSV data here..."
                        :rows="10"
                        class="csv-input"
                    />
                </n-form-item>
                <n-space justify="end">
                    <n-button @click="clearForm" size="large">Clear</n-button>
                    <n-button type="primary" attr-type="submit" size="large" :disabled="!inputText.trim()">
                        Import
                    </n-button>
                </n-space>
            </n-form>
        </n-card>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useIngredientStore } from '@/store/ingredient'
import csvToIngredients from '@/utils/csvToIngredients'
import { useToast } from '@/composables/useToast'
import { NForm, NFormItem, NInput, NButton, NSpace, NCard } from 'naive-ui'

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

const clearForm = () => {
  inputText.value = ''
  ingredients.value = []
}
</script>

<style scoped>
.quick-import-view {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    background-color: #1a1a1a;
    min-height: 100vh;
}

.import-form-card {
    margin-top: 20px;
}

.csv-input {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
}
</style>
