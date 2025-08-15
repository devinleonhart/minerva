<template>
  <div class="ingredient-list">
    <n-input
      v-model:value="searchQuery"
      placeholder="Search ingredients..."
      size="large"
      class="search-input"
    />

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
              Add to Inventory
            </n-button>
            <n-button
              v-if="ingredientDeletability[ingredient.id]?.canDelete"
              @click="handleDelete(ingredient.id)"
              type="error"
              size="small"
            >
              Delete
            </n-button>
            <n-tooltip v-else-if="ingredientDeletability[ingredient.id]?.reason" trigger="hover">
              <template #trigger>
                <n-button
                  disabled
                  type="error"
                  size="small"
                >
                  Delete
                </n-button>
              </template>
              {{ ingredientDeletability[ingredient.id]?.reason }}
            </n-tooltip>
          </n-space>
        </template>
      </n-card>
    </n-space>

    <n-empty v-if="sortedIngredients.length === 0" description="No ingredients found." />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useIngredientStore } from '@/store/ingredient'
import { useInventoryStore } from '@/store/inventory'
import { useToast } from '@/composables/useToast'
import {
  NInput,
  NButton,
  NSpace,
  NCard,
  NEmpty,
  NTooltip
} from 'naive-ui'

const ingredientStore = useIngredientStore()
const inventoryStore = useInventoryStore()
const toast = useToast()
const { ingredients } = storeToRefs(useIngredientStore())
const ingredientDeletability = ref<Record<number, { canDelete: boolean; reason: string | null }>>({})

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
  await checkAllIngredientsDeletability()
})

const checkAllIngredientsDeletability = async () => {
  for (const ingredient of ingredients.value) {
    const deletability = await ingredientStore.checkIngredientDeletability(ingredient.id)
    ingredientDeletability.value[ingredient.id] = deletability
  }
}

const handleDelete = async (id: number) => {
  try {
    await ingredientStore.deleteIngredient(id)
    await ingredientStore.getIngredients()
    await checkAllIngredientsDeletability()
    toast.success('Ingredient deleted successfully!')
  } catch (error: unknown) {
    console.error('Error deleting ingredient:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete ingredient. Please try again.'
    toast.error(errorMessage)
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
