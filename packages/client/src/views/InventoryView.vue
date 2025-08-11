<template>
  <div class="inventory-view">
    <h1>Inventory</h1>
    <div v-if="inventoryItems.length === 0 && potionItems.length === 0" class="empty-state">
      <p>Your inventory is empty. Visit the ingredients page to add items!</p>
    </div>

    <!-- Ingredients Section -->
    <div v-if="inventoryItems.length > 0">
      <h2>Ingredients</h2>
      <div class="inventory-grid">
        <div
          v-for="item in inventoryItems"
          :key="item.id"
          class="inventory-item"
        >
          <div class="item-header">
            <h3>{{ item.ingredient.name }}</h3>
            <span class="quantity">x{{ item.quantity }}</span>
          </div>
          <p class="description">{{ item.ingredient.description }}</p>
          <div class="item-controls">
            <select
              v-model="item.quality"
              @change="updateQuality(item.id, item.quality)"
              class="quality-select"
            >
              <option value="NORMAL">Normal</option>
              <option value="HQ">High Quality</option>
              <option value="LQ">Low Quality</option>
            </select>
            <div class="quantity-controls">
              <button
                @click="updateQuantity(item.id, item.quantity - 1)"
                :disabled="item.quantity <= 1"
                class="quantity-btn"
              >
                -
              </button>
              <span class="quantity-display">{{ item.quantity }}</span>
              <button
                @click="updateQuantity(item.id, item.quantity + 1)"
                class="quantity-btn"
              >
                +
              </button>
            </div>
            <button
              @click="deleteItem(item.id)"
              class="delete-btn"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Potions Section -->
    <div v-if="potionItems.length > 0">
      <h2>Potions</h2>
      <div class="inventory-grid">
        <div
          v-for="item in potionItems"
          :key="item.id"
          class="inventory-item potion-item"
        >
          <div class="item-header">
            <h3>{{ item.potion.recipe.name }}</h3>
            <span class="quantity">x{{ item.quantity }}</span>
          </div>
          <p class="description">{{ item.potion.recipe.description }}</p>
          <div class="potion-info">
            <span class="quality-badge quality-{{ item.potion.quality.toLowerCase() }}">
              {{ item.potion.quality }}
            </span>
          </div>
          <div class="item-controls">
            <div class="quantity-controls">
              <button
                @click="updatePotionQuantity(item.id, item.quantity - 1)"
                :disabled="item.quantity <= 1"
                class="quantity-btn"
              >
                -
              </button>
              <span class="quantity-display">{{ item.quantity }}</span>
              <button
                @click="updatePotionQuantity(item.id, item.quantity + 1)"
                class="quantity-btn"
              >
                +
              </button>
            </div>
            <button
              @click="deletePotionItem(item.id)"
              class="delete-btn"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useInventoryStore } from '@/store/inventory'

const inventoryStore = useInventoryStore()
const { inventoryItems, potionItems } = storeToRefs(inventoryStore)

onMounted(async () => {
  await inventoryStore.getInventory()
})

const updateQuality = async (id: number, quality: string) => {
  try {
    await inventoryStore.updateInventoryItem(id, { quality: quality as 'NORMAL' | 'HQ' | 'LQ' })
  } catch (error) {
    console.error('Error updating quality:', error)
  }
}

const updateQuantity = async (id: number, newQuantity: number) => {
  if (newQuantity < 0) return

  try {
    await inventoryStore.updateInventoryItem(id, { quantity: newQuantity })
  } catch (error) {
    console.error('Error updating quantity:', error)
  }
}

const deleteItem = async (id: number) => {
  try {
    await inventoryStore.deleteInventoryItem(id)
  } catch (error) {
    console.error('Error deleting item:', error)
  }
}

const updatePotionQuantity = async (id: number, newQuantity: number) => {
  if (newQuantity < 0) return

  try {
    await inventoryStore.updatePotionInventoryItem(id, { quantity: newQuantity })
  } catch (error) {
    console.error('Error updating potion quantity:', error)
  }
}

const deletePotionItem = async (id: number) => {
  try {
    await inventoryStore.deletePotionInventoryItem(id)
  } catch (error) {
    console.error('Error deleting potion:', error)
  }
}
</script>

<style scoped>
.inventory-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.inventory-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-header h3 {
  margin: 0;
  color: #333;
}

.quantity {
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
}

.description {
  color: #666;
  margin-bottom: 16px;
  font-size: 14px;
}

.item-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quality-select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.quantity-btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-display {
  min-width: 40px;
  text-align: center;
  font-weight: bold;
}

.delete-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.delete-btn:hover {
  background: #c82333;
}

.potion-item {
  border-left: 4px solid #6f42c1;
}

.potion-info {
  margin-bottom: 16px;
}

.quality-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.quality-normal {
  background: #6c757d;
  color: white;
}

.quality-hq {
  background: #28a745;
  color: white;
}

.quality-lq {
  background: #dc3545;
  color: white;
}
</style>
