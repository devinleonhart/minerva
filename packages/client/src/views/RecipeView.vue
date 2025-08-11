<template>
  <div class="recipe-view">
    <div class="recipe-header">
      <h1>Recipes</h1>
      <button @click="showCreateForm = true" class="create-recipe-btn">
        Create New Recipe
      </button>
    </div>

    <!-- Create Recipe Form -->
    <div v-if="showCreateForm" class="create-recipe-form">
      <h2>Create New Recipe</h2>
      <form @submit.prevent="handleCreateRecipe">
        <div class="form-group">
          <label for="recipe-name">Recipe Name:</label>
          <input
            id="recipe-name"
            v-model="newRecipe.name"
            type="text"
            required
            placeholder="Enter recipe name"
          />
        </div>

        <div class="form-group">
          <label for="recipe-description">Description:</label>
          <textarea
            id="recipe-description"
            v-model="newRecipe.description"
            required
            placeholder="Enter recipe description"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Ingredients:</label>
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
                <label :for="`quantity-${ingredient.id}`">Qty:</label>
                <input
                  :id="`quantity-${ingredient.id}`"
                  :value="getIngredientQuantity(ingredient.id)"
                  type="number"
                  min="1"
                  class="quantity-input"
                  @click.stop
                  @input="updateIngredientQuantity(ingredient.id, $event)"
                />
                <button
                  type="button"
                  class="add-ingredient-btn"
                  @click="toggleIngredient(ingredient.id)"
                >
                  {{ isIngredientSelected(ingredient.id) ? 'Remove' : 'Add' }}
                </button>
              </div>
            </div>
          </div>
          <p class="ingredient-count">
            Selected: {{ selectedIngredients.length }} ingredients
          </p>
        </div>

        <div class="form-actions">
          <button type="submit" class="submit-btn" :disabled="!canCreateRecipe">
            Create Recipe
          </button>
          <button type="button" @click="cancelCreate" class="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Recipe List -->
    <div v-if="recipes.length === 0 && !showCreateForm" class="empty-state">
      <p>No recipes created yet. Create your first recipe to get started!</p>
    </div>

    <div v-else-if="!showCreateForm" class="recipe-grid">
      <div
        v-for="recipe in recipes"
        :key="recipe.id"
        class="recipe-card"
      >
        <div class="recipe-header">
          <h3>{{ recipe.name }}</h3>
          <div class="recipe-actions">
            <button @click="editRecipe(recipe)" class="edit-btn">Edit</button>
            <button @click="deleteRecipe(recipe.id)" class="delete-btn">Delete</button>
          </div>
        </div>

        <p class="recipe-description">{{ recipe.description }}</p>

        <div class="recipe-ingredients">
          <h4>Ingredients:</h4>
          <ul>
            <li v-for="recipeIngredient in recipe.ingredients" :key="recipeIngredient.ingredientId">
              {{ recipeIngredient.ingredient.name }} ({{ recipeIngredient.quantity }})
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRecipeStore } from '@/store/recipe'
import { useIngredientStore } from '@/store/ingredient'
import type { Recipe } from '@/types/store/recipe'

const recipeStore = useRecipeStore()
const ingredientStore = useIngredientStore()

const { recipes } = storeToRefs(recipeStore)
const { ingredients } = storeToRefs(ingredientStore)

const showCreateForm = ref(false)
const newRecipe = ref({
  name: '',
  description: '',
  ingredients: [] as Array<{ ingredientId: number; quantity: number }>
})

const selectedIngredients = ref<Array<{ ingredientId: number; quantity: number }>>([])

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
  } catch (error) {
    console.error('Error creating recipe:', error)
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
  if (confirm('Are you sure you want to delete this recipe?')) {
    try {
      await recipeStore.deleteRecipe(id)
    } catch (error) {
      console.error('Error deleting recipe:', error)
    }
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

.recipe-header h1 {
  margin: 0;
  color: #333;
}

.create-recipe-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
}

.create-recipe-btn:hover {
  background: #218838;
}

.create-recipe-form {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.create-recipe-form h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
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
  color: #333;
  margin-bottom: 4px;
}

.ingredient-description {
  display: block;
  font-size: 12px;
  color: #666;
}

.ingredient-quantity {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.ingredient-quantity label {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.quantity-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.add-ingredient-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  white-space: nowrap;
}

.add-ingredient-btn:hover {
  background: #0056b3;
}

.ingredient-count {
  margin: 0;
  font-size: 14px;
  color: #666;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.submit-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn:hover {
  background: #545b62;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.recipe-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.recipe-card .recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.recipe-card .recipe-header h3 {
  margin: 0;
  color: #333;
  flex: 1;
}

.recipe-actions {
  display: flex;
  gap: 8px;
}

.edit-btn {
  background: #ffc107;
  color: #212529;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.edit-btn:hover {
  background: #e0a800;
}

.delete-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.delete-btn:hover {
  background: #c82333;
}

.recipe-description {
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.recipe-ingredients h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
}

.recipe-ingredients ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.recipe-ingredients li {
  margin-bottom: 4px;
}
</style>
