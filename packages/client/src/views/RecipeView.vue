<template>
  <div class="recipe-view">
    <div class="recipe-header">
      <n-h1>Recipes</n-h1>
              <n-button @click="showCreateForm = true" type="primary" size="large">
          Create New Recipe
        </n-button>
    </div>

    <!-- Create Recipe Form Modal -->
    <n-modal v-model:show="showCreateForm" preset="card" title="Create New Recipe" style="width: 600px">
      <n-form @submit.prevent="handleCreateRecipe" :model="newRecipe" label-placement="top">
        <n-form-item label="Recipe Name" path="name">
          <n-input v-model:value="newRecipe.name" placeholder="Enter recipe name" />
        </n-form-item>

        <n-form-item label="Description" path="description">
          <n-input
            v-model:value="newRecipe.description"
            type="textarea"
            placeholder="Enter recipe description"
            :rows="3"
          />
        </n-form-item>

        <n-form-item label="Ingredients">
          <div class="ingredient-selection">
            <div
              v-for="ingredient in availableIngredients"
              :key="ingredient.id"
              class="ingredient-option"
              :class="{ selected: isIngredientSelected(ingredient.id) }"
            >
              <div class="ingredient-info">
                <span class="ingredient-name">{{ ingredient.name }}</span>
                <span class="ingredient-description">{{ ingredient.description }}</span>
              </div>
              <div class="ingredient-quantity">
                <n-input-number
                  :value="getIngredientQuantity(ingredient.id)"
                  :min="1"
                  size="small"
                  placeholder="Qty"
                  @update:value="(value: number | null) => updateIngredientQuantity(ingredient.id, { target: { value: value || 1 } })"
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
          <p class="ingredient-count">
            Selected: {{ selectedIngredients.length }} ingredients
          </p>
        </n-form-item>

        <n-space justify="end">
          <n-button @click="cancelCreate">Cancel</n-button>
          <n-button type="primary" :disabled="!canCreateRecipe" attr-type="submit">
            Create Recipe
          </n-button>
        </n-space>
      </n-form>
    </n-modal>

    <!-- Recipe List -->
    <n-empty v-if="recipes.length === 0 && !showCreateForm" description="No recipes created yet. Create your first recipe to get started!" />

    <div v-else-if="!showCreateForm" class="recipe-grid">
      <n-card
        v-for="recipe in recipes"
        :key="recipe.id"
        class="recipe-card"
        :title="recipe.name"
        size="medium"
      >
        <template #header-extra>
          <n-space>
            <n-button @click="checkCraftability(recipe.id)" type="info" size="small">
              Craft
            </n-button>
            <n-button @click="editRecipe(recipe)" type="warning" size="small">
              Edit
            </n-button>
            <n-button @click="deleteRecipe(recipe.id)" type="error" size="small">
              Delete
            </n-button>
          </n-space>
        </template>

        <p class="recipe-description">{{ recipe.description }}</p>
        <n-divider />
        <div class="recipe-ingredients">
          <h4>Ingredients:</h4>
          <n-space vertical>
            <n-tag
              v-for="recipeIngredient in recipe.ingredients"
              :key="recipeIngredient.ingredientId"
              type="info"
              size="medium"
            >
              {{ recipeIngredient.ingredient.name }} ({{ recipeIngredient.quantity }})
            </n-tag>
          </n-space>
        </div>
      </n-card>
    </div>

    <!-- Ingredient Selection Modal for Crafting -->
    <n-modal v-model:show="showCraftModal" preset="card" :title="`Craft ${selectedRecipe?.name}`" style="width: 600px">
      <div v-if="craftability" class="craft-modal-content">
        <div class="craft-status">
          <n-tag v-if="craftability.isCraftable" type="success" size="large">
            ✅ Recipe is craftable!
          </n-tag>
          <n-tag v-else type="error" size="large">
            ❌ Recipe cannot be crafted - insufficient ingredients
          </n-tag>
        </div>

        <n-divider />

        <div class="ingredient-selections">
          <h3>Select Ingredients:</h3>
          <div
            v-for="ingredient in craftability.ingredients"
            :key="ingredient.ingredientId"
            class="ingredient-selection-item"
            :class="{ 'insufficient': !ingredient.isCraftable }"
          >
            <div class="ingredient-info">
              <span class="ingredient-name">{{ ingredient.ingredientName }}</span>
              <span class="ingredient-requirement">
                Required: {{ ingredient.requiredQuantity }} | Available: {{ ingredient.availableQuantity }}
              </span>
            </div>

            <div v-if="ingredient.isCraftable" class="quality-selection">
                              <n-select
                  v-model:value="craftingIngredients[ingredient.ingredientId]"
                  placeholder="Choose quality..."
                  :options="ingredient.availableOptions.map((option: any) => ({
                    label: `${option.quality} (${option.totalAvailable} available)`,
                    value: option.inventoryItemId
                  }))"
                />
            </div>
            <div v-else class="insufficient-message">
              Need {{ ingredient.requiredQuantity - ingredient.availableQuantity }} more
            </div>
          </div>
        </div>

        <n-divider />

        <n-space justify="end">
          <n-button @click="closeCraftModal">Cancel</n-button>
          <n-button
            @click="craftPotion"
            :disabled="!canCraftPotion"
            type="primary"
            size="large"
          >
            Craft Potion
          </n-button>
        </n-space>
      </div>

      <div v-else class="craft-modal-content">
        <n-empty description="Loading recipe information..." />
      </div>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRecipeStore } from '@/store/recipe'
import { useIngredientStore } from '@/store/ingredient'
import { usePotionStore } from '@/store/potion'
import { useToast } from '@/composables/useToast'
import {
  NH1,
  NButton,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NDivider,
  NCard,
  NTag,
  NEmpty
} from 'naive-ui'
import type { Recipe } from '@/types/store/recipe'



const recipeStore = useRecipeStore()
const ingredientStore = useIngredientStore()
const potionStore = usePotionStore()
const toast = useToast()

const { recipes } = storeToRefs(recipeStore)
const { ingredients } = storeToRefs(ingredientStore)
const { craftability } = storeToRefs(potionStore)

const showCreateForm = ref(false)
const showCraftModal = ref(false)
const selectedRecipe = ref<Recipe | null>(null)

const newRecipe = ref({
  name: '',
  description: '',
  ingredients: [] as Array<{ ingredientId: number; quantity: number }>
})

const selectedIngredients = ref<Array<{ ingredientId: number; quantity: number }>>([])
const craftingIngredients = ref<Record<number, number>>({}) // ingredientId -> inventoryItemId

const availableIngredients = computed(() => ingredients.value)

const canCreateRecipe = computed(() =>
  newRecipe.value.name.trim() &&
  newRecipe.value.description.trim() &&
  selectedIngredients.value.length > 0
)

onMounted(async () => {
  await Promise.all([
    recipeStore.getRecipes(),
    ingredientStore.getIngredients()
  ])
})

const toggleIngredient = (ingredientId: number) => {
  const index = selectedIngredients.value.findIndex(ing => ing.ingredientId === ingredientId)
  if (index > -1) {
    selectedIngredients.value.splice(index, 1)
  } else {
    selectedIngredients.value.push({ ingredientId, quantity: 1 })
  }
}

const isIngredientSelected = (ingredientId: number) => {
  return selectedIngredients.value.some(ing => ing.ingredientId === ingredientId)
}

const getIngredientQuantity = (ingredientId: number) => {
  const ingredient = selectedIngredients.value.find(ing => ing.ingredientId === ingredientId)
  return ingredient ? ingredient.quantity : 1
}

const updateIngredientQuantity = (ingredientId: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const quantity = parseInt(target.value) || 1

  if (isIngredientSelected(ingredientId)) {
    const ingredient = selectedIngredients.value.find(ing => ing.ingredientId === ingredientId)
    if (ingredient) {
      ingredient.quantity = quantity
    }
  }
}

const checkCraftability = async (recipeId: number) => {
  try {
    const recipe = recipes.value.find(r => r.id === recipeId)
    if (recipe) {
      selectedRecipe.value = recipe
      showCraftModal.value = true
      await potionStore.checkRecipeCraftability(recipeId)
    }
  } catch (error) {
    console.error('Error checking craftability:', error)
  }
}

const closeCraftModal = () => {
  showCraftModal.value = false
  selectedRecipe.value = null
  craftingIngredients.value = {}
}

const canCraftPotion = computed(() => {
  if (!craftability.value) return false
  return craftability.value.ingredients.every(ing =>
    ing.isCraftable && craftingIngredients.value[ing.ingredientId]
  )
})

const craftPotion = async () => {
  if (!craftability.value || !selectedRecipe.value) return

  try {
    const ingredientSelections = craftability.value.ingredients.map(ing => ({
      ingredientId: ing.ingredientId,
      inventoryItemId: craftingIngredients.value[ing.ingredientId],
      quantity: ing.requiredQuantity
    }))

    await potionStore.craftPotion({
      recipeId: selectedRecipe.value.id,
      ingredientSelections
    })

    // Refresh inventory and close modal
    await ingredientStore.getIngredients() // This should refresh inventory too
    closeCraftModal()

    // Show success message
    toast.success('Potion crafted successfully!')
  } catch (error) {
    console.error('Error crafting potion:', error)
    toast.error('Failed to craft potion. Please try again.')
  }
}

const handleCreateRecipe = async () => {
  try {
    await recipeStore.createRecipe({
      name: newRecipe.value.name,
      description: newRecipe.value.description,
      ingredients: selectedIngredients.value
    })

    // Reset form
    newRecipe.value = { name: '', description: '', ingredients: [] }
    selectedIngredients.value = []
    showCreateForm.value = false

    toast.success('Recipe created successfully!')
  } catch (error) {
    console.error('Error creating recipe:', error)
    toast.error('Failed to create recipe. Please try again.')
  }
}

const cancelCreate = () => {
  newRecipe.value = { name: '', description: '', ingredients: [] }
  selectedIngredients.value = []
  showCreateForm.value = false
}

const editRecipe = (recipe: Recipe) => {
  // TODO: Implement edit functionality
  console.log('Edit recipe:', recipe)
}

const deleteRecipe = async (id: number) => {
  try {
    await recipeStore.deleteRecipe(id)
    toast.success('Recipe deleted successfully!')
  } catch (error) {
    console.error('Error deleting recipe:', error)
    toast.error('Failed to delete recipe. Please try again.')
  }
}
</script>

<style scoped>
.recipe-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.ingredient-selection {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.ingredient-option {
  border: 2px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.2s;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.ingredient-option:hover {
  border-color: #007bff;
  background: #e7f3ff;
}

.ingredient-option.selected {
  border-color: #28a745;
  background: #d4edda;
}

.ingredient-info {
  flex: 1;
}

.ingredient-name {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
}

.ingredient-description {
  display: block;
  font-size: 12px;
}

.ingredient-quantity {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.ingredient-quantity label {
  font-size: 12px;
  margin: 0;
}

.ingredient-count {
  margin: 0;
  font-size: 14px;
  font-style: italic;
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}
</style>
