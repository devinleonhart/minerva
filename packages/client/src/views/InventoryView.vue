<template>
  <div class="inventory-view">
    <n-h1>Inventory</n-h1>
    <n-empty v-if="inventoryItems.length === 0 && potionItems.length === 0 && itemItems.length === 0" description="Your inventory is empty. Visit the ingredients page to add items!" />

    <!-- Ingredients Section -->
    <div v-if="inventoryItems.length > 0">
      <n-h2>Ingredients</n-h2>
      <div class="inventory-grid">
        <n-card
          v-for="item in inventoryItems"
          :key="item.id"
          class="inventory-item"
          size="medium"
        >
          <template #header>
            <div class="item-header">
              <span>{{ item.ingredient.name }}</span>
              <n-tag :type="getQualityTagType(item.quality)" size="small">
                {{ item.quality }}
              </n-tag>
            </div>
          </template>

          <p class="description">{{ item.ingredient.description }}</p>

          <template #footer>
            <div class="item-controls">
              <n-select
                v-model:value="item.quality"
                @update:value="(value) => updateQuality(item.id, value)"
                :options="[
                  { label: 'Normal', value: 'NORMAL' },
                  { label: 'High Quality', value: 'HQ' },
                  { label: 'Low Quality', value: 'LQ' }
                ]"
                size="small"
              />
              <div class="quantity-controls">
                <n-button
                  @click="updateQuantity(item.id, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                  size="small"
                >
                  -
                </n-button>
                <span class="quantity-display">{{ item.quantity }}</span>
                <n-button
                  @click="updateQuantity(item.id, item.quantity + 1)"
                  size="small"
                >
                  +
                </n-button>
              </div>
              <n-button
                @click="deleteItem(item.id)"
                type="error"
                size="small"
              >
                Remove
              </n-button>
            </div>
          </template>
        </n-card>
      </div>
    </div>

    <!-- Potions Section -->
    <div v-if="potionItems.length > 0">
      <n-h2>Potions</n-h2>
      <div class="inventory-grid">
        <n-card
          v-for="item in potionItems"
          :key="item.id"
          class="inventory-item potion-item"
          size="medium"
        >
          <template #header>
            <div class="item-header">
              <span>{{ item.potion.recipe.name }}</span>
              <n-tag :type="getPotionQualityTagType(item.potion.quality)" size="small">
                {{ item.potion.quality }}
              </n-tag>
            </div>
          </template>

          <p class="description">{{ item.potion.recipe.description }}</p>

          <template #footer>
            <div class="item-controls">
              <div class="quantity-controls">
                <n-button
                  @click="updatePotionQuantity(item.id, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                  size="small"
                >
                  -
                </n-button>
                <span class="quantity-display">{{ item.quantity }}</span>
                <n-button
                  @click="updatePotionQuantity(item.id, item.quantity + 1)"
                  size="small"
                >
                  +
                </n-button>
              </div>
              <n-button
                @click="deletePotionItem(item.id)"
                type="error"
                size="small"
              >
                Remove
              </n-button>
            </div>
          </template>
        </n-card>
      </div>
    </div>

    <!-- Items Section -->
    <div v-if="itemItems.length > 0">
      <n-h2>Items</n-h2>
      <div class="inventory-grid">
        <n-card
          v-for="item in itemItems"
          :key="item.id"
          class="inventory-item item-item"
          size="medium"
        >
          <template #header>
            <div class="item-header">
              <span>{{ item.item.name }}</span>
            </div>
          </template>

          <p class="description">{{ item.item.description }}</p>

          <template #footer>
            <div class="item-controls">
              <n-button
                @click="deleteItemItem(item.id)"
                type="error"
                size="small"
              >
                Remove
              </n-button>
            </div>
          </template>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useInventoryStore } from '@/store/inventory'
import { useToast } from '@/composables/useToast'
import {
  NH1,
  NH2,
  NButton,
  NSelect,
  NTag,
  NCard,
  NEmpty
} from 'naive-ui'



const inventoryStore = useInventoryStore()
const toast = useToast()
const { inventoryItems, potionItems, itemItems } = storeToRefs(inventoryStore)

onMounted(async () => {
  await inventoryStore.getInventory()
})

const updateQuality = async (id: number, quality: string) => {
  try {
    await inventoryStore.updateInventoryItem(id, { quality: quality as 'NORMAL' | 'HQ' | 'LQ' })
    toast.success('Quality updated successfully!')
  } catch (error) {
    console.error('Error updating quality:', error)
    toast.error('Failed to update quality. Please try again.')
  }
}

const updateQuantity = async (id: number, newQuantity: number) => {
  if (newQuantity < 0) return

  try {
    await inventoryStore.updateInventoryItem(id, { quantity: newQuantity })
    toast.success('Quantity updated successfully!')
  } catch (error) {
    console.error('Error updating quantity:', error)
    toast.error('Failed to update quantity. Please try again.')
  }
}

const deleteItem = async (id: number) => {
  try {
    await inventoryStore.deleteInventoryItem(id)
    toast.success('Item removed from inventory!')
  } catch (error) {
    console.error('Error deleting item:', error)
    toast.error('Failed to remove item. Please try again.')
  }
}

const updatePotionQuantity = async (id: number, newQuantity: number) => {
  if (newQuantity < 0) return

  try {
    await inventoryStore.updatePotionInventoryItem(id, { quantity: newQuantity })
    toast.success('Potion quantity updated successfully!')
  } catch (error) {
    console.error('Error updating potion quantity:', error)
    toast.error('Failed to update potion quantity. Please try again.')
  }
}

const deletePotionItem = async (id: number) => {
  try {
    await inventoryStore.deletePotionInventoryItem(id)
    toast.success('Potion removed from inventory!')
  } catch (error) {
    console.error('Error deleting potion:', error)
  }
}

const deleteItemItem = async (id: number) => {
  try {
    await inventoryStore.deleteItemInventoryItem(id)
    toast.success('Item removed from inventory!')
  } catch (error) {
    console.error('Error deleting item:', error)
    toast.error('Failed to remove item. Please try again.')
  }
}

const getQualityTagType = (quality: string) => {
  switch (quality) {
  case 'HQ': return 'success'
  case 'LQ': return 'error'
  default: return 'info'
  }
}

const getPotionQualityTagType = (quality: string) => {
  switch (quality) {
  case 'HQ': return 'success'
  case 'LQ': return 'error'
  case 'NORMAL': return 'info'
  default: return 'default'
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

.item-item {
  border-left: 4px solid #fd7e14;
}
</style>
