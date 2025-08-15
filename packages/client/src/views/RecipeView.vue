<template>
  <ViewLayout>
    <ViewHeader
      :show-search="true"
      search-placeholder="Search recipes..."
      :search-value="searchQuery"
      @update:search-value="searchQuery = $event"
    >
      <template #left>
        <n-button @click="showCreateForm = true" type="primary" size="large">
          Create New Recipe
        </n-button>
      </template>
    </ViewHeader>

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
          <n-button @click="cancelCreate">Cancel</n-button>
          <n-button type="primary" :disabled="!canCreateRecipe" attr-type="submit">
            Create Recipe
          </n-button>
        </n-space>
      </n-form>
    </n-modal>

    <!-- Recipe List -->
    <n-empty v-if="filteredRecipes.length === 0 && !showCreateForm" description="No recipes created yet. Create your first recipe to get started!" />

    <GridLayout v-else-if="!showCreateForm" variant="default">
      <n-card
        v-for="recipe in filteredRecipes"
        :key="recipe.id"
        class="recipe-card"
        size="medium"
      >
        <template #header>
          <CardHeader :title="recipe.name">
            <template #actions>
              <n-tag
                :type="getRecipeCraftabilityType(recipe.id)"
                size="small"
                class="craftability-indicator"
              >
                {{ getRecipeCraftabilityText(recipe.id) }}
              </n-tag>
              <n-button @click="checkCraftability(recipe.id)" type="info" size="small">
                Craft
              </n-button>
              <n-button @click="handleAddPotion(recipe)" type="success" size="small">
                Add
              </n-button>
              <n-button @click="handleEdit(recipe)" type="primary" size="small">
                Edit
              </n-button>
              <n-button
                v-if="recipeDeletability[recipe.id]?.canDelete"
                @click="deleteRecipe(recipe.id)"
                type="error"
                size="small"
              >
                Delete
              </n-button>
              <n-tooltip v-else-if="recipeDeletability[recipe.id]?.reason" trigger="hover">
                <template #trigger>
                  <n-button
                    disabled
                    type="error"
                    size="small"
                  >
                    Delete
                  </n-button>
                </template>
                {{ recipeDeletability[recipe.id]?.reason }}
              </n-tooltip>
            </template>
          </CardHeader>
        </template>

        <div class="recipe-content">
          <p class="recipe-description">{{ recipe.description }}</p>
          <n-divider />
          <div class="recipe-ingredients">
            <h4>Ingredients:</h4>
            <div class="ingredients-tags">
              <n-tag
                v-for="recipeIngredient in recipe.ingredients"
                :key="recipeIngredient.ingredientId"
                type="info"
                size="medium"
                class="ingredient-tag"
              >
                {{ recipeIngredient.ingredient.name }} x{{ recipeIngredient.quantity }} ({{ getAvailableIngredientQuantity(recipeIngredient.ingredientId) }})
              </n-tag>
            </div>
          </div>


        </div>
      </n-card>
    </GridLayout>

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

        <div class="quality-selection">
          <h3>Select Potion Quality:</h3>
          <n-select
            v-model:value="selectedQuality"
            placeholder="Choose quality..."
            :options="qualityOptions"
            style="width: 200px"
          />
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

    <!-- Edit Recipe Modal -->
    <EditRecipeModal
      v-model:modelValue="showEditModal"
      :recipe="editingRecipe"
      @recipe-updated="handleRecipeUpdate"
    />
  </ViewLayout>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRecipeStore } from '@/store/recipe'
import { useIngredientStore } from '@/store/ingredient'
import { usePotionStore } from '@/store/potion'
import { useInventoryStore } from '@/store/inventory'
import { useToast } from '@/composables/useToast'
import {
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
  NEmpty,
  NTooltip
} from 'naive-ui'
import type { Recipe } from '../types/store/recipe'
import ViewLayout from '@/components/shared/ViewLayout.vue'
import ViewHeader from '@/components/shared/ViewHeader.vue'
import GridLayout from '@/components/shared/GridLayout.vue'
import CardHeader from '@/components/shared/CardHeader.vue'
import EditRecipeModal from '@/components/shared/EditRecipeModal.vue'

const recipeStore = useRecipeStore()
const ingredientStore = useIngredientStore()
const potionStore = usePotionStore()
const inventoryStore = useInventoryStore()
const toast = useToast()

const { recipes } = storeToRefs(recipeStore)
const { ingredients } = storeToRefs(ingredientStore)
const { craftability } = storeToRefs(potionStore)
const { inventoryItems } = storeToRefs(inventoryStore)

const showCreateForm = ref(false)
const showCraftModal = ref(false)
const showEditModal = ref(false)
const selectedRecipe = ref<Recipe | null>(null)
const editingRecipe = ref<Recipe | null>(null)
const recipesCraftability = ref<Record<number, boolean>>({})
const searchQuery = ref('')
const ingredientFilter = ref('')

const newRecipe = ref({
  name: '',
  description: '',
  ingredients: [] as Array<{ ingredientId: number; quantity: number }>
})

const selectedIngredients = ref<Array<{ ingredientId: number; quantity: number }>>([])
const craftingIngredients = ref<Record<number, number>>({})
const selectedQuality = ref('NORMAL')

const qualityOptions = [
  { label: 'Normal Quality', value: 'NORMAL' },
  { label: 'High Quality', value: 'HQ' },
  { label: 'Low Quality', value: 'LQ' }
]

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

const filteredRecipes = computed(() => {
  let filtered = recipes.value

  if (searchQuery.value) {
    filtered = filtered.filter(recipe =>
      recipe.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

const canCreateRecipe = computed(() =>
  newRecipe.value.name.trim() &&
  newRecipe.value.description.trim() &&
  selectedIngredients.value.length > 0
)

onMounted(async () => {
  await Promise.all([
    recipeStore.getRecipes(),
    ingredientStore.getIngredients(),
    inventoryStore.getInventory()
  ])
  await Promise.all([
    checkAllRecipesCraftability(),
    checkAllRecipesDeletability()
  ])
})

const checkAllRecipesCraftability = async () => {
  for (const recipe of recipes.value) {
    try {
      await potionStore.checkRecipeCraftability(recipe.id)
      if (craftability.value) {
        recipesCraftability.value[recipe.id] = craftability.value.isCraftable
      }
    } catch (error) {
      console.error(`Error checking craftability for recipe ${recipe.id}:`, error)
      recipesCraftability.value[recipe.id] = false
    }
  }
}

const checkAllRecipesDeletability = async () => {
  for (const recipe of recipes.value) {
    try {
      await checkRecipeDeletability(recipe.id)
    } catch (error) {
      console.error(`Error checking deletability for recipe ${recipe.id}:`, error)
    }
  }
}

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

const updateIngredientQuantity = (ingredientId: number, quantity: number) => {
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
      if (craftability.value) {
        recipesCraftability.value[recipeId] = craftability.value.isCraftable
      }
    }
  } catch (error) {
    console.error('Error checking craftability:', error)
  }
}

const closeCraftModal = () => {
  showCraftModal.value = false
  selectedRecipe.value = null
  craftingIngredients.value = {}
  selectedQuality.value = 'NORMAL'
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
      quality: selectedQuality.value,
      ingredientSelections
    })

    await ingredientStore.getIngredients()
    closeCraftModal()
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

    newRecipe.value = {
      name: '',
      description: '',
      ingredients: []
    }
    selectedIngredients.value = []
    ingredientFilter.value = ''
    showCreateForm.value = false

    toast.success('Recipe created successfully!')
    await checkAllRecipesDeletability()
  } catch (error) {
    console.error('Error creating recipe:', error)
    toast.error('Failed to create recipe. Please try again.')
  }
}

const cancelCreate = () => {
  newRecipe.value = {
    name: '',
    description: '',
    ingredients: []
  }
  selectedIngredients.value = []
  ingredientFilter.value = ''
    showCreateForm.value = false
}

const handleEdit = (recipe: Recipe) => {
  editingRecipe.value = recipe
  showEditModal.value = true
}

const handleAddPotion = async (recipe: Recipe) => {
  try {
    // Create a potion directly without crafting requirements
    await potionStore.addPotionDirectly({
      recipeId: recipe.id,
      quality: 'NORMAL'
    })

    toast.success(`Added ${recipe.name} to inventory!`)
  } catch (error) {
    console.error('Error adding potion:', error)
    toast.error('Failed to add potion. Please try again.')
  }
}

const handleRecipeUpdate = async (updatedRecipe: Recipe) => {
  try {
    await recipeStore.updateRecipe(updatedRecipe.id, {
      name: updatedRecipe.name,
      description: updatedRecipe.description,
      ingredients: updatedRecipe.ingredients.map(ing => ({
        ingredientId: ing.ingredientId,
        quantity: ing.quantity
      }))
    })

    showEditModal.value = false
    editingRecipe.value = null
    toast.success('Recipe updated successfully!')
    await checkAllRecipesDeletability()
  } catch (error) {
    console.error('Error updating recipe:', error)
    toast.error('Failed to update recipe. Please try again.')
  }
}

const recipeDeletability = ref<Record<number, { canDelete: boolean; reason: string | null }>>({})

const checkRecipeDeletability = async (recipeId: number) => {
  try {
    const deletability = await recipeStore.checkRecipeDeletability(recipeId)
    recipeDeletability.value[recipeId] = deletability
  } catch (error) {
    console.error('Error checking recipe deletability:', error)
    recipeDeletability.value[recipeId] = { canDelete: false, reason: 'Error checking deletability' }
  }
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

const getRecipeCraftabilityType = (recipeId: number): 'success' | 'error' | 'info' => {
  const isCraftable = recipesCraftability.value[recipeId]
  if (isCraftable === undefined) return 'info'
  return isCraftable ? 'success' : 'error'
}

const getRecipeCraftabilityText = (recipeId: number): string => {
  const isCraftable = recipesCraftability.value[recipeId]
  if (isCraftable === undefined) return 'Checking...'
  return isCraftable ? 'Craftable' : 'Not Craftable'
}

// Helper function to get total available quantity for an ingredient
const getAvailableIngredientQuantity = (ingredientId: number): number => {
  return inventoryItems.value
    .filter(item => item.ingredientId === ingredientId)
    .reduce((total, item) => total + item.quantity, 0)
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



.recipe-card {
  height: fit-content;
}

.recipe-content {
  margin-top: 8px;
}

.recipe-description {
  margin: 8px 0;
  color: #666;
  line-height: 1.5;
}

.recipe-ingredients {
  margin-top: 16px;
}

.recipe-ingredients h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
}

.ingredients-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.ingredient-tag {
  margin: 0;
}

.craftability-indicator {
  margin-right: 10px;
}

.quality-selection {
  margin: 20px 0;
}

.quality-selection h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
}

/* Crafting modal ingredient spacing */
.ingredient-selections {
  margin: 20px 0;
}

.ingredient-selection-item {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid #404040;
  border-radius: 8px;
  background: #2a2a2a;
}

.ingredient-selection-item:last-child {
  margin-bottom: 0;
}

.ingredient-selection-item.insufficient {
  border-color: #d03050;
  background: #2a1a1a;
}


</style>
