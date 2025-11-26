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
      <ResourceList>
        <ResourceRow
          v-for="item in filteredPotionItems"
          :key="item.id"
          :title="getPotionDisplayName(item)"
          :subtitle="item.potion.quality"
          indicator="info"
        >
          <div class="inventory-meta" :title="item.potion.recipe?.description">
            {{ item.potion.recipe?.description || 'No description available' }}
          </div>
          <template #actions>
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
        </ResourceRow>
      </ResourceList>
    </div>

    <!-- Ingredients Section -->
    <div v-if="!isLoading && filteredInventoryItems.length > 0">
      <h2 class="section-header">Ingredients</h2>
      <ResourceList>
        <ResourceRow
          v-for="item in filteredInventoryItems"
          :key="item.id"
          :title="item.ingredient.name"
          :subtitle="item.ingredient.description"
          :indicator="item.quality === 'HQ' ? 'success' : item.quality === 'LQ' ? 'error' : 'info'"
          :indicator-tooltip="`Quality: ${item.quality}`"
        >
          <div class="inventory-meta">
            Qty: {{ item.quantity }}
          </div>
          <template #actions>
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
        </ResourceRow>
      </ResourceList>
    </div>

    <!-- Items Section -->
    <div v-if="!isLoading && filteredItemItems.length > 0">
      <h2 class="section-header">Items</h2>
      <ResourceList>
        <ResourceRow
          v-for="item in filteredItemItems"
          :key="item.id"
          :title="item.item.name"
          :subtitle="item.item.description"
        >
          <div class="inventory-meta">
            Qty: {{ item.quantity }}
          </div>
          <template #actions>
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
        </ResourceRow>
      </ResourceList>
    </div>

    <!-- Currencies Section -->
    <div v-if="!isLoading && filteredCurrencies.length > 0">
      <h2 class="section-header">Currencies</h2>
      <ResourceList>
        <ResourceRow
          v-for="currency in filteredCurrencies"
          :key="currency.id"
          :title="currency.name"
          :subtitle="`Total: ${currency.value}`"
          indicator="warning"
        >
          <template #actions>
            <div class="currency-controls">
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
        </ResourceRow>
      </ResourceList>
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
  NEmpty,
  NInputNumber
} from 'naive-ui'
import ViewLayout from '@/components/shared/ViewLayout.vue'
import ViewHeader from '@/components/shared/ViewHeader.vue'
import ResourceList from '@/components/shared/ResourceList.vue'
import ResourceRow from '@/components/shared/ResourceRow.vue'
import AddCurrencyModal from '@/components/shared/AddCurrencyModal.vue'
import CreateItemModal from '@/components/shared/CreateItemModal.vue'
import type { PotionInventoryItem } from '@/types/store/inventory'

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



const getPotionDisplayName = (item: PotionInventoryItem): string => {
  // Use cauldron name if it exists, otherwise use recipe name
  const recipe = item.potion?.recipe
  if (!recipe) return 'Unknown Potion'

  return recipe.cauldronName || recipe.name || 'Unknown Potion'
}

const handleItemCreated = async () => {
  await inventoryStore.getInventory()
}
</script>

<style scoped>
.inventory-meta {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #b5b5b5;
  font-size: 12px;
}

.item-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-display {
  min-width: 36px;
  text-align: center;
  font-weight: bold;
}

@media (max-width: 480px) {
  .item-controls {
    flex-direction: column;
    align-items: flex-start;
  }
}

.section-header {
  margin: 24px 20px 8px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #ffffff;
  border-bottom: 1px solid #333;
  padding-bottom: 6px;
}

.currency-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.currency-controls .n-input-number {
  width: 120px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
