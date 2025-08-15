<template>
  <div class="ingredient-list">
    <div v-if="sortedIngredients.length === 0" class="empty-state">
      <n-empty description="No ingredients found." />
    </div>

    <GridLayout v-else variant="default">
      <n-card
        v-for="ingredient in sortedIngredients"
        :key="ingredient.id"
        size="medium"
        class="ingredient-card"
      >
        <template #header>
          <div class="ingredient-header">
            <CardHeader :title="ingredient.name">
              <template #actions>
                <n-button
                  @click="handleAddToInventory(ingredient.id, 'HQ')"
                  type="success"
                  size="small"
                  class="quality-btn"
                >
                  HQ
                </n-button>
                <n-button
                  @click="handleAddToInventory(ingredient.id, 'NORMAL')"
                  type="info"
                  size="small"
                  class="quality-btn"
                >
                  NQ
                </n-button>
                <n-button
                  @click="handleAddToInventory(ingredient.id, 'LQ')"
                  type="warning"
                  size="small"
                  class="quality-btn"
                >
                  LQ
                </n-button>
                <n-button
                  @click="handleEdit(ingredient)"
                  type="primary"
                  size="small"
                >
                  Edit
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
              </template>
            </CardHeader>
            <span
              class="secured-star"
              :class="{ 'secured': ingredient.secured }"
              @click="handleToggleSecured(ingredient.id, !ingredient.secured)"
              :title="ingredient.secured ? 'Secured ingredient - click to unsecure' : 'Unsecured ingredient - click to secure'"
            >
              ★
            </span>
          </div>
        </template>

        <div class="ingredient-content">
          <p class="ingredient-description">{{ ingredient.description }}</p>
        </div>
      </n-card>
    </GridLayout>

    <EditIngredientModal
      v-model:modelValue="showEditModal"
      :ingredient="selectedIngredient"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useIngredientStore } from '@/store/ingredient'
import { useInventoryStore } from '@/store/inventory'
import { useToast } from '@/composables/useToast'
import {
  NButton,
  NCard,
  NEmpty,
  NTooltip
} from 'naive-ui'
import GridLayout from '@/components/shared/GridLayout.vue'
import CardHeader from '@/components/shared/CardHeader.vue'
import EditIngredientModal from './EditIngredientModal.vue'

import type { IngredientListProps } from '@/types/components'
import type { Ingredient } from '@/types/store/ingredient'

const props = defineProps<IngredientListProps>()

const ingredientStore = useIngredientStore()
const inventoryStore = useInventoryStore()
const toast = useToast()
const { ingredients } = storeToRefs(useIngredientStore())
const ingredientDeletability = ref<Record<number, { canDelete: boolean; reason: string | null }>>({})
const showEditModal = ref(false)
const selectedIngredient = ref<Ingredient | null>(null)

const sortedIngredients = computed(() => {
  let sorted = [...ingredients.value]
  if (props.searchQuery) {
    sorted = sorted.filter(ingredient => {
      return ingredient.name.toLowerCase().includes(props.searchQuery.toLowerCase()) ||
        ingredient.description.toLowerCase().includes(props.searchQuery.toLowerCase())
    })
  }
  return sorted.sort((a, b) => a.name.localeCompare(b.name))
})

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

const handleEdit = (ingredient: Ingredient) => {
  selectedIngredient.value = ingredient
  showEditModal.value = true
}

const handleToggleSecured = async (id: number, secured: boolean) => {
  try {
    await ingredientStore.toggleSecured(id, secured)
    toast.success(secured ? 'Ingredient secured!' : 'Ingredient unsecured!')
  } catch (error) {
    console.error('Error toggling ingredient secured status:', error)
    toast.error('Failed to update ingredient secured status. Please try again.')
  }
}

const handleAddToInventory = async (ingredientId: number, quality: 'HQ' | 'NORMAL' | 'LQ') => {
  try {
    await inventoryStore.addToInventory({
      ingredientId,
      quality,
      quantity: 1
    })
    const qualityText = quality === 'NORMAL' ? 'Normal Quality' : quality === 'HQ' ? 'High Quality' : 'Low Quality'
    toast.success(`${qualityText} ingredient added to inventory!`)
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

.empty-state {
  margin-top: 20px;
}

.ingredient-card {
  height: fit-content;
}

.ingredient-header {
  position: relative;
  width: 100%;
}

.secured-star {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 20px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  color: #e0e0e0;
  z-index: 10;
}

.secured-star:hover {
  transform: scale(1.1);
}

.secured-star.secured {
  color: #f59e0b;
}

.secured-star.secured:hover {
  color: #d97706;
}

.ingredient-content {
  margin-top: 8px;
}

.ingredient-description {
  margin: 8px 0;
  color: #666;
  line-height: 1.5;
}

.quality-btn {
  min-width: 36px;
}
</style>
