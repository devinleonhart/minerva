<template>
  <n-modal
    v-model:show="show"
    preset="card"
    title="Edit Recipe"
    style="width: 600px; max-height: 80vh; overflow-y: auto;"
  >
    <n-form ref="formRef" :model="editRecipe" label-placement="top">
      <n-form-item label="Recipe Name" path="name" :rule="{ required: true, message: 'Please enter recipe name' }">
        <n-input
          v-model:value="editRecipe.name"
          placeholder="Enter recipe name"
        />
      </n-form-item>

      <n-form-item label="Description" path="description" :rule="{ required: true, message: 'Please enter recipe description' }">
        <n-input
          v-model:value="editRecipe.description"
          type="textarea"
          placeholder="Enter recipe description"
          :rows="3"
        />
      </n-form-item>

      <n-form-item label="Filter Ingredients">
        <n-input
          v-model:value="ingredientFilter"
          placeholder="Filter ingredients..."
          clearable
        />
      </n-form-item>

      <n-form-item label="Available Ingredients">
        <div class="ingredient-grid">
          <div
            v-for="ingredient in filteredIngredients"
            :key="ingredient.id"
            class="ingredient-card"
            :class="{ selected: isIngredientSelected(ingredient.id) }"
          >
            <div class="ingredient-info">
              <span class="ingredient-name">{{ ingredient.name }}</span>
              <span class="ingredient-description">{{ ingredient.description }}</span>
            </div>
            <div class="ingredient-actions">
              <n-input-number
                v-if="isIngredientSelected(ingredient.id)"
                :value="getIngredientQuantity(ingredient.id)"
                :min="1"
                size="small"
                style="width: 80px; margin-right: 8px;"
                @update:value="(value: number | null) => updateIngredientQuantity(ingredient.id, value || 1)"
              />
              <n-button
                :type="isIngredientSelected(ingredient.id) ? 'error' : 'primary'"
                size="small"
                @click="toggleIngredient(ingredient.id)"
              >
                {{ isIngredientSelected(ingredient.id) ? 'Remove' : 'Add' }}
              </n-button>
            </div>
          </div>
        </div>
      </n-form-item>

      <n-space justify="end">
        <n-button @click="handleCancel">Cancel</n-button>
        <n-button type="primary" :disabled="!isValid" @click="handleSubmit">
          Update Recipe
        </n-button>
      </n-space>
    </n-form>
  </n-modal>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useIngredientStore } from '@/store/ingredient'
import type { Recipe } from '@/types/store/recipe'

interface Props {
  modelValue: boolean
  recipe: Recipe | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'recipe-updated', recipe: Recipe): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const ingredientStore = useIngredientStore()
const { ingredients } = storeToRefs(ingredientStore)

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const editRecipe = ref({
  name: '',
  description: '',
  ingredients: [] as Array<{ ingredientId: number; quantity: number }>
})

const selectedIngredients = ref<Array<{ ingredientId: number; quantity: number }>>([])
const ingredientFilter = ref('')

const availableIngredients = computed(() => {
  return [...ingredients.value].sort((a, b) => a.name.localeCompare(b.name))
})

const filteredIngredients = computed(() => {
  if (!ingredientFilter.value) {
    return availableIngredients.value
  }

  return availableIngredients.value.filter(ingredient =>
    ingredient.name.toLowerCase().includes(ingredientFilter.value.toLowerCase()) ||
    ingredient.description.toLowerCase().includes(ingredientFilter.value.toLowerCase())
  )
})

const isValid = computed(() =>
  editRecipe.value.name.trim() &&
  editRecipe.value.description.trim() &&
  selectedIngredients.value.length > 0
)

// Watch for recipe changes to populate the form
watch(() => props.recipe, (newRecipe) => {
  if (newRecipe) {
    editRecipe.value.name = newRecipe.name
    editRecipe.value.description = newRecipe.description
    selectedIngredients.value = newRecipe.ingredients.map(ing => ({
      ingredientId: ing.ingredientId,
      quantity: ing.quantity
    }))
  }
}, { immediate: true })

const toggleIngredient = (ingredientId: number) => {
  const index = selectedIngredients.value.findIndex(ing => ing.ingredientId === ingredientId)
  if (index > -1) {
    selectedIngredients.value.splice(index, 1)
  } else {
    selectedIngredients.value.push({ ingredientId, quantity: 1 })
  }
}

const isIngredientSelected = (ingredientId: number): boolean => {
  return selectedIngredients.value.some(ing => ing.ingredientId === ingredientId)
}

const getIngredientQuantity = (ingredientId: number): number => {
  const ingredient = selectedIngredients.value.find(ing => ing.ingredientId === ingredientId)
  return ingredient?.quantity || 1
}

const updateIngredientQuantity = (ingredientId: number, quantity: number) => {
  const ingredient = selectedIngredients.value.find(ing => ing.ingredientId === ingredientId)
  if (ingredient) {
    ingredient.quantity = quantity
  }
}

const handleSubmit = () => {
  if (!props.recipe) return

  const updatedRecipe = {
    ...props.recipe,
    name: editRecipe.value.name,
    description: editRecipe.value.description,
    ingredients: selectedIngredients.value
  }

  emit('recipe-updated', updatedRecipe)
}

const handleCancel = () => {
  show.value = false
}
</script>

<style scoped>
.ingredient-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.ingredient-card {
  border: 2px solid #404040;
  border-radius: 8px;
  padding: 12px;
  background: #2a2a2a;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ingredient-card:hover {
  border-color: #18a058;
  background: #2f2f2f;
}

.ingredient-card.selected {
  border-color: #18a058;
  background: #0c7a43;
}

.ingredient-info {
  flex: 1;
}

.ingredient-name {
  font-weight: 600;
  font-size: 14px;
  display: block;
  margin-bottom: 4px;
}

.ingredient-description {
  font-size: 12px;
  color: #ccc;
  line-height: 1.3;
}

.ingredient-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
