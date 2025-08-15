<template>
  <ViewLayout>
    <ViewHeader
      :show-search="true"
      search-placeholder="Search inventory..."
      :search-value="searchQuery"
      @update:search-value="searchQuery = $event"
    >
      <template #left>
        <div class="header-actions">
          <n-button @click="showAddCurrencyModal = true" type="primary" size="large">
            Add New Currency
          </n-button>
          <n-button @click="showCreateItemModal = true" type="primary" size="large">
            Add New Item
          </n-button>
        </div>
      </template>
    </ViewHeader>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-indicator" style="text-align: center; padding: 40px; color: #888;">
      Loading inventory...
    </div>

    <n-empty v-if="!isLoading && filteredInventoryItems.length === 0 && filteredPotionItems.length === 0 && filteredItemItems.length === 0 && filteredCurrencies.length === 0" :description="searchQuery ? `No items found matching '${searchQuery}'` : 'Your inventory is empty. Add some items to get started!'" />

    <!-- Potions Section -->
    <div v-if="!isLoading && filteredPotionItems.length > 0">
      <h2 class="section-header">Potions</h2>
      <GridLayout variant="default">
        <n-card
          v-for="item in filteredPotionItems"
          :key="item.id"
          class="inventory-item potion-item"
          size="medium"
        >
          <template #header>
            <CardHeader :title="getPotionDisplayName(item)">
              <template #actions>
                <n-tag :type="getPotionQualityTagType(item.potion.quality)" size="small">
                  {{ item.potion.quality }}
                </n-tag>
              </template>
            </CardHeader>
          </template>

          <div class="inventory-content">
            <p class="description">{{ item.potion.recipe?.description || 'No description available' }}</p>
          </div>

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
      </GridLayout>
    </div>

    <!-- Ingredients Section -->
    <div v-if="!isLoading && filteredInventoryItems.length > 0">
      <h2 class="section-header">Ingredients</h2>
      <GridLayout variant="default">
        <n-card
          v-for="item in filteredInventoryItems"
          :key="item.id"
          class="inventory-item ingredient-item"
          size="medium"
        >
          <template #header>
            <CardHeader :title="item.ingredient.name">
              <template #actions>
                <n-tag :type="getQualityTagType(item.quality)" size="small">
                  {{ item.quality }}
                </n-tag>
              </template>
            </CardHeader>
          </template>

          <div class="inventory-content">
            <p class="description">{{ item.ingredient.description }}</p>
          </div>

          <template #footer>
            <div class="item-controls">
              <div class="quantity-controls">
                <n-button
                  @click="updateIngredientQuantity(item.id, item.quality, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                  size="small"
                >
                  -
                </n-button>
                <span class="quantity-display">{{ item.quantity }}</span>
                <n-button
                  @click="updateIngredientQuantity(item.id, item.quality, item.quantity + 1)"
                  size="small"
                >
                  +
                </n-button>
              </div>
              <n-button
                @click="deleteInventoryItem(item.id)"
                type="error"
                size="small"
              >
                Remove
              </n-button>
            </div>
          </template>
        </n-card>
      </GridLayout>
    </div>

    <!-- Items Section -->
    <div v-if="!isLoading && filteredItemItems.length > 0">
      <h2 class="section-header">Items</h2>
      <GridLayout variant="default">
        <n-card
          v-for="item in filteredItemItems"
          :key="item.id"
          class="inventory-item"
          size="medium"
        >
          <template #header>
            <CardHeader :title="item.item.name" />
          </template>

          <div class="inventory-content">
            <p class="description">{{ item.item.description }}</p>
          </div>

          <template #footer>
            <div class="item-controls">
              <div class="quantity-controls">
                <n-button
                  @click="updateItemQuantity(item.id, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                  size="small"
                >
                  -
                </n-button>
                <span class="quantity-display">{{ item.quantity }}</span>
                <n-button
                  @click="updateItemQuantity(item.id, item.quantity + 1)"
                  size="small"
                >
                  +
                </n-button>
              </div>
                              <n-button
                  @click="deleteItemFromInventory(item.id)"
                  type="error"
                  size="small"
                >
                Remove
              </n-button>
            </div>
          </template>
        </n-card>
      </GridLayout>
    </div>

    <!-- Currencies Section -->
    <div v-if="!isLoading && filteredCurrencies.length > 0">
      <h2 class="section-header">Currencies</h2>
      <GridLayout variant="default">
        <n-card
          v-for="currency in filteredCurrencies"
          :key="currency.id"
          class="inventory-item currency-item"
          size="medium"
        >
          <template #header>
            <CardHeader :title="currency.name" />
          </template>

          <div class="inventory-content">
            <p class="description">Value: {{ currency.value }}</p>
          </div>

          <template #footer>
            <div class="item-controls">
              <n-input-number
                v-model:value="currency.value"
                :min="0"
                :precision="0"
                size="small"
                placeholder="Value"
                @update:value="(value: number | null) => updateCurrencyValue(currency.id, value || 0)"
              />
              <n-button
                @click="deleteCurrency(currency.id)"
                type="error"
                size="small"
              >
                Remove
              </n-button>
            </div>
          </template>
        </n-card>
      </GridLayout>
    </div>

    <!-- Modals -->
    <AddCurrencyModal v-model:modelValue="showAddCurrencyModal" />
    <CreateItemModal v-model:modelValue="showCreateItemModal" @item-created="handleItemCreated" />
  </ViewLayout>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useInventoryStore } from '@/store/inventory'
import { useToast } from '@/composables/useToast'

import {
  NButton,
  NTag,
  NCard,
  NEmpty,
  NInputNumber
} from 'naive-ui'
import ViewLayout from '@/components/shared/ViewLayout.vue'
import ViewHeader from '@/components/shared/ViewHeader.vue'
import GridLayout from '@/components/shared/GridLayout.vue'
import CardHeader from '@/components/shared/CardHeader.vue'
import AddCurrencyModal from '@/components/shared/AddCurrencyModal.vue'
import CreateItemModal from '@/components/shared/CreateItemModal.vue'

const inventoryStore = useInventoryStore()
const toast = useToast()
const { inventoryItems, potionItems, itemItems, currencies } = storeToRefs(inventoryStore)
const searchQuery = ref('')
const isLoading = ref(false)
const showAddCurrencyModal = ref(false)
const showCreateItemModal = ref(false)

const filteredInventoryItems = computed(() => {
  if (!inventoryItems.value || !Array.isArray(inventoryItems.value)) return []

  let filtered = inventoryItems.value

  if (searchQuery.value) {
    filtered = filtered.filter(item => {
      const ingredient = item.ingredient
      if (!ingredient) return false

      const searchLower = searchQuery.value.toLowerCase()
      return ingredient.name.toLowerCase().includes(searchLower) ||
             ingredient.description?.toLowerCase().includes(searchLower) ||
             item.quality.toLowerCase().includes(searchLower) ||
             item.quantity.toString().includes(searchLower)
    })
  }

  return filtered.sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name))
})

const filteredPotionItems = computed(() => {
  if (!potionItems.value || !Array.isArray(potionItems.value)) return []

  let filtered = potionItems.value

  if (searchQuery.value) {
    filtered = filtered.filter(item => {
      const potion = item.potion
      if (!potion) return false

      const searchLower = searchQuery.value.toLowerCase()
      return potion.recipe?.name?.toLowerCase().includes(searchLower) ||
             potion.recipe?.cauldronName?.toLowerCase().includes(searchLower) ||
             potion.recipe?.description?.toLowerCase().includes(searchLower) ||
             potion.quality?.toLowerCase().includes(searchLower) ||
             item.quantity.toString().includes(searchLower)
    })
  }

  return filtered.sort((a, b) => {
    const nameA = a.potion?.recipe?.cauldronName || a.potion?.recipe?.name || ''
    const nameB = b.potion?.recipe?.cauldronName || b.potion?.recipe?.name || ''
    return nameA.localeCompare(nameB)
  })
})

const filteredItemItems = computed(() => {
  if (!itemItems.value || !Array.isArray(itemItems.value)) return []

  let filtered = itemItems.value

  if (searchQuery.value) {
    filtered = filtered.filter(item => {
      const itemData = item.item
      if (!itemData) return false

      const searchLower = searchQuery.value.toLowerCase()
      return itemData.name.toLowerCase().includes(searchLower) ||
             itemData.description?.toLowerCase().includes(searchLower) ||
             item.quantity.toString().includes(searchLower)
    })
  }

  return filtered.sort((a, b) => a.item.name.localeCompare(b.item.name))
})

const filteredCurrencies = computed(() => {
  if (!currencies.value || !Array.isArray(currencies.value)) return []

  let filtered = currencies.value

  if (searchQuery.value) {
    filtered = filtered.filter(currency => {
      const searchLower = searchQuery.value.toLowerCase()
      return currency.name.toLowerCase().includes(searchLower) ||
             currency.value.toString().includes(searchLower)
    })
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

onMounted(async () => {
  isLoading.value = true
  try {
    await inventoryStore.getInventory()
  } catch (error) {
    console.error('Failed to load data:', error)
    toast.error('Failed to load data. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
})



const updatePotionQuantity = async (id: number, newQuantity: number) => {
  if (newQuantity < 0) return

  try {
    await inventoryStore.updatePotionInventoryItem(id, newQuantity)
    toast.success('Potion quantity updated successfully!')
  } catch (error) {
    console.error('Error updating potion quantity:', error)
    toast.error('Failed to update potion quantity. Please try again.')
  }
}

const deletePotionItem = async (id: number) => {
  try {
    await inventoryStore.deletePotionFromInventory(id)
    await inventoryStore.getInventory() // Refresh inventory data
    toast.success('Potion removed from inventory!')
  } catch (error) {
    console.error('Error deleting potion:', error)
    toast.error('Failed to remove potion. Please try again.')
  }
}

const updateItemQuantity = async (id: number, newQuantity: number) => {
  if (newQuantity < 0) return

  try {
    await inventoryStore.updateItemInventoryItem(id, newQuantity)
    toast.success('Item quantity updated successfully!')
  } catch (error) {
    console.error('Error updating item quantity:', error)
    toast.error('Failed to update item quantity. Please try again.')
  }
}

const deleteItemFromInventory = async (id: number) => {
  try {
    await inventoryStore.deleteItemFromInventory(id)
    await inventoryStore.getInventory() // Refresh inventory data
    toast.success('Item removed from inventory!')
  } catch (error) {
    console.error('Error deleting item:', error)
    toast.error('Failed to remove item. Please try again.')
  }
}

const updateCurrencyValue = async (id: number, value: number) => {
  try {
    await inventoryStore.updateCurrency(id, value)
    toast.success('Currency value updated successfully!')
  } catch (error) {
    console.error('Error updating currency value:', error)
    toast.error('Failed to update currency value. Please try again.')
  }
}

const deleteCurrency = async (id: number) => {
  try {
    await inventoryStore.deleteCurrency(id)
    await inventoryStore.getInventory() // Refresh inventory data
    toast.success('Currency removed successfully!')
  } catch (error) {
    console.error('Error deleting currency:', error)
    toast.error('Failed to remove currency. Please try again.')
  }
}

const updateIngredientQuantity = async (id: number, quality: string, newQuantity: number) => {
  if (newQuantity < 0) return

  try {
    await inventoryStore.updateInventoryItem(id, quality, newQuantity)
    toast.success('Ingredient quantity updated successfully!')
  } catch (error) {
    console.error('Error updating ingredient quantity:', error)
    toast.error('Failed to update ingredient quantity. Please try again.')
  }
}

const deleteInventoryItem = async (id: number) => {
  try {
    await inventoryStore.deleteInventoryItem(id)
    await inventoryStore.getInventory() // Refresh inventory data
    toast.success('Ingredient removed from inventory!')
  } catch (error) {
    console.error('Error deleting ingredient:', error)
    toast.error('Failed to remove ingredient. Please try again.')
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

const getPotionDisplayName = (item: any): string => {
  // Use cauldron name if it exists, otherwise use recipe name
  const recipe = item.potion?.recipe
  if (!recipe) return 'Unknown Potion'

  return recipe.cauldronName || recipe.name || 'Unknown Potion'
}

const getQualityTagType = (quality: string) => {
  switch (quality) {
  case 'HQ': return 'success'
  case 'LQ': return 'error'
  case 'NORMAL': return 'info'
  default: return 'default'
  }
}

const handleItemCreated = async () => {
  await inventoryStore.getInventory()
}
</script>

<style scoped>
.inventory-item {
  height: fit-content;
}

.inventory-content {
  margin-top: 8px;
}

.description {
  margin: 8px 0;
  color: #666;
  line-height: 1.5;
}

.item-controls {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-display {
  min-width: 40px;
  text-align: center;
  font-weight: bold;
}

/* Responsive breakpoint for small screens */
@media (max-width: 480px) {
  .item-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .quantity-controls {
    justify-content: center;
  }
}

.section-header {
  margin: 24px 0 16px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  border-bottom: 2px solid #404040;
  padding-bottom: 8px;
}

.currency-item {
  border-left: 4px solid #f59e0b;
}

.currency-value {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

.value-label {
  font-weight: 500;
  color: #666;
}

.value-display {
  font-size: 1.5rem;
  font-weight: bold;
  color: #f59e0b;
}

.currency-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.currency-controls .n-input-number {
  width: 120px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.subsection-header {
  margin: 16px 0 12px 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: #cccccc;
  border-bottom: 1px solid #333;
  padding-bottom: 4px;
}

.available-items-section {
  margin-bottom: 24px;
}

.inventory-items-section {
  margin-bottom: 24px;
}

.available-item {
  border-left: 4px solid #10b981;
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
