<template>
  <n-card title="Add New Ingredient" class="add-form-card" size="medium">
    <n-form @submit.prevent="handleIngredientAdded" :model="ingredient" label-placement="top">
      <n-form-item label="Name" path="name">
        <n-input
          v-model:value="ingredient.name"
          placeholder="Enter ingredient name"
          required
        />
      </n-form-item>
      <n-form-item label="Description" path="description">
        <n-input
          v-model:value="ingredient.description"
          type="textarea"
          placeholder="Enter ingredient description"
          :rows="3"
          required
        />
      </n-form-item>
      <n-space justify="end">
        <n-button @click="resetForm" size="large">Reset</n-button>
        <n-button type="primary" attr-type="submit" size="large">
          Add Ingredient
        </n-button>
      </n-space>
    </n-form>
  </n-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useIngredientStore } from '@/store/ingredient'
import { useToast } from '@/composables/useToast'
import { NForm, NFormItem, NInput, NButton, NSpace, NCard } from 'naive-ui'

import type { IngredientForm } from '#/store/ingredient'

const ingredientStore = useIngredientStore()
const toast = useToast()

const ingredient = ref<IngredientForm>({
  name: '',
  description: ''
})

const handleIngredientAdded = async () => {
  try {
    await ingredientStore.addIngredient(ingredient.value)
    await ingredientStore.getIngredients()
    resetForm()
    toast.success('Ingredient added successfully!')
  } catch (error) {
    console.error('Error adding ingredient:', error)
    toast.error('Failed to add ingredient. Please try again.')
  }
}

const resetForm = () => {
  ingredient.value = {
    name: '',
    description: ''
  }
}
</script>

<style scoped>
.add-form-card {
  margin-top: 20px;
}
</style>
