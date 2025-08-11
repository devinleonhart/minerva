<template>
  <div class="ingredient-list">
    <n-input
      v-model:value="searchQuery"
      placeholder="Search ingredients..."
      size="large"
      class="search-input"
    >
      <template #prefix>
        <n-icon><SearchIcon /></n-icon>
      </template>
    </n-input>

    <n-space vertical size="medium" class="ingredients-container">
      <n-card
        v-for="ingredient in sortedIngredients"
        :key="ingredient.id"
        size="medium"
        class="ingredient-card"
      >
        <template #header>
          <span class="ingredient-name">{{ ingredient.name }}</span>
        </template>

        <p class="ingredient-description">{{ ingredient.description }}</p>

        <template #footer>
          <n-space justify="end">
            <n-button
              @click="handleAddToInventory(ingredient.id)"
              type="success"
              size="small"
            >
              <template #icon>
                <n-icon><AddIcon /></n-icon>
              </template>
              Add to Inventory
            </n-button>
            <n-button
              @click="handleDelete(ingredient.id)"
              type="error"
              size="small"
            >
              <template #icon>
                <n-icon><DeleteIcon /></n-icon>
              </template>
              Delete
            </n-button>
          </n-space>
        </template>
      </n-card>
    </n-space>

    <n-empty v-if="sortedIngredients.length === 0" description="No ingredients found." />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, computed, ref, h } from 'vue'
import { storeToRefs } from 'pinia'
import { useIngredientStore } from '@/store/ingredient'
import { useInventoryStore } from '@/store/inventory'
import { useToast } from '@/composables/useToast'
import {
  NInput,
  NIcon,
  NButton,
  NSpace,
  NCard,
  NEmpty
} from 'naive-ui'

// Icon components
const SearchIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
  h('path', { d: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' })
])

const AddIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
  h('path', { d: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z' })
])

const DeleteIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
  h('path', { d: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z' })
])

const ingredientStore = useIngredientStore()
const inventoryStore = useInventoryStore()
const toast = useToast()
const { ingredients } = storeToRefs(useIngredientStore())
const sortedIngredients = computed(() => {
  let sorted = [...ingredients.value]
  if (searchQuery.value) {
    sorted = sorted.filter(ingredient => {
      return ingredient.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        ingredient.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    })
  }
  return sorted.sort((a, b) => a.name.localeCompare(b.name))
})
const searchQuery = ref('')

onMounted(async () => {
  await ingredientStore.getIngredients()
})

const handleDelete = async (id: number) => {
  try {
    await ingredientStore.deleteIngredient(id)
    await ingredientStore.getIngredients()
    toast.success('Ingredient deleted successfully!')
  } catch (error) {
    console.error('Error deleting ingredient:', error)
    toast.error('Failed to delete ingredient. Please try again.')
  }
}

const handleAddToInventory = async (ingredientId: number) => {
  try {
    await inventoryStore.addToInventory({ ingredientId })
    toast.success('Ingredient added to inventory!')
  } catch (error) {
    console.error('Error adding to inventory:', error)
    toast.error('Failed to add ingredient to inventory. Please try again.')
  }
}
</script>

<style scoped>
.ingredient-list {
  padding: 20px;
}

.search-input {
  margin-bottom: 20px;
  max-width: 400px;
}

.ingredients-container {
  margin-bottom: 20px;
}

.ingredient-card {
  margin-bottom: 16px;
}

.ingredient-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.ingredient-description {
  margin: 8px 0;
  color: #666;
  line-height: 1.5;
}
</style>
