<template>
  <input type="text" v-model="searchQuery" placeholder="Search">
  <ul>
    <li v-for="ingredient in sortedIngredients" :key="ingredient.id">
      {{ ingredient.name }} - {{ ingredient.description }}
      <div class="ingredient-actions">
        <button @click="handleAddToInventory(ingredient.id)" class="add-to-inventory-btn">
          Add to Inventory
        </button>
        <button @click="handleDelete(ingredient.id)" class="delete-btn">Delete</button>
      </div>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { onMounted, computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useIngredientStore } from '@/store/ingredient'
import { useInventoryStore } from '@/store/inventory'

const ingredientStore = useIngredientStore()
const inventoryStore = useInventoryStore()
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
  await ingredientStore.deleteIngredient(id)
  await ingredientStore.getIngredients()
}

const handleAddToInventory = async (ingredientId: number) => {
  try {
    await inventoryStore.addToInventory({ ingredientId })
    // Show success feedback (you could add a toast notification here)
  } catch (error) {
    console.error('Error adding to inventory:', error)
    // Show error feedback
  }
}
</script>

<style scoped>
.ingredient-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.add-to-inventory-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.add-to-inventory-btn:hover {
  background: #218838;
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
</style>
