<template>
  <div class="ingredient-list">
    <div v-if="sortedIngredients.length === 0" class="empty-state">
      <n-empty description="No ingredients found." />
    </div>

    <ResourceList v-else>
      <ResourceRow
        v-for="ingredient in sortedIngredients"
        :key="ingredient.id"
        :title="ingredient.name"
        :subtitle="ingredient.description"
      >
        <template #leading>
          <div class="ingredient-leading">
            <span
              class="secured-star"
              :class="{ secured: ingredient.secured }"
              @click="handleToggleSecured(ingredient.id, !ingredient.secured)"
              :title="ingredient.secured ? 'Secured ingredient - click to unsecure' : 'Unsecured ingredient - click to secure'"
            >
              ★
            </span>
            <div class="ingredient-leading-text">
              <p class="ingredient-name">{{ ingredient.name }}</p>
              <p class="ingredient-description" :title="ingredient.description">{{ ingredient.description }}</p>
            </div>
          </div>
        </template>

        <div class="ingredient-tags">
          <span class="ingredient-pill" :class="ingredient.secured ? 'pill-secured' : 'pill-unsecured'">
            {{ ingredient.secured ? 'Secured' : 'Unsecured' }}
          </span>
        </div>

        <template #actions>
          <div class="ingredient-actions">
            <n-button
              @click="handleAddToInventory(ingredient.id, 'HQ')"
              type="success"
              size="small"
              ghost
            >
              HQ
            </n-button>
            <n-button
              @click="handleAddToInventory(ingredient.id, 'NORMAL')"
              type="info"
              size="small"
              ghost
            >
              NQ
            </n-button>
            <n-button
              @click="handleAddToInventory(ingredient.id, 'LQ')"
              type="warning"
              size="small"
              ghost
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
                <n-button disabled type="error" size="small">
                  Delete
                </n-button>
              </template>
              {{ ingredientDeletability[ingredient.id]?.reason }}
            </n-tooltip>
          </div>
        </template>
      </ResourceRow>
    </ResourceList>

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
  NEmpty,
  NTooltip
} from 'naive-ui'
import ResourceList from '@/components/shared/ResourceList.vue'
import ResourceRow from '@/components/shared/ResourceRow.vue'
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
  padding: 0 0 16px;
}

.empty-state {
  margin-top: 20px;
}

.ingredient-leading {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.secured-star {
  font-size: 18px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  color: #e0e0e0;
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

.ingredient-leading-text {
  min-width: 0;
}

.ingredient-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ingredient-description {
  margin: 0;
  font-size: 12px;
  color: #bcbcbc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ingredient-tags {
  display: flex;
  gap: 6px;
}

.ingredient-pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pill-secured {
  background: rgba(24, 160, 88, 0.15);
  color: #63e2b7;
  border: 1px solid rgba(24, 160, 88, 0.4);
}

.pill-unsecured {
  background: rgba(208, 48, 80, 0.15);
  color: #ff7a9b;
  border: 1px solid rgba(208, 48, 80, 0.3);
}

.ingredient-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
