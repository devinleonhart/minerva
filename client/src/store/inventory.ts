import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import type { InventoryItem, PotionInventoryItem, ItemInventoryItem, Currency } from '../types/store/inventory'

// Centralized error logging for store operations
const logStoreError = (storeName: string, operation: string, error: unknown) => {
  console.error(`[${storeName}] Error ${operation}:`, error)
  if (error && typeof error === 'object' && 'response' in error && error.response) {
    const axiosError = error as { response: { status: number; data: unknown } }
    console.error(`[${storeName}] Response status: ${axiosError.response.status}`)
    console.error(`[${storeName}] Response data:`, axiosError.response.data)
  }
}

export const useInventoryStore = defineStore('inventory', () => {
  const inventoryItems = ref<InventoryItem[]>([])
  const potionItems = ref<PotionInventoryItem[]>([])
  const itemItems = ref<ItemInventoryItem[]>([])
  const currencies = ref<Currency[]>([])

  const addToInventory = async (data: { ingredientId: number; quality: string; quantity: number }) => {
    try {
      await axios.post('/api/inventory', {
        ingredientId: data.ingredientId,
        quality: data.quality,
        quantity: data.quantity
      })
      await getInventory() // Always refresh after successful add
    } catch (error) {
      console.error('Error adding to inventory:', error)
      throw error
    }
  }

  const getInventory = async () => {
    try {
      const response = await axios.get('/api/inventory')
      const { ingredients, potions, items, currencies: curr } = response.data

      if (Array.isArray(ingredients) && Array.isArray(potions) && Array.isArray(items) && Array.isArray(curr)) {
        inventoryItems.value = ingredients
        potionItems.value = potions
        itemItems.value = items
        currencies.value = curr
      }
    } catch (error: unknown) {
      logStoreError('Inventory Store', 'fetching inventory', error)
      throw error
    }
  }

  const updateInventoryItem = async (id: number, quality: string, quantity: number) => {
    try {
      await axios.put(`/api/inventory/${id}`, {
        quality,
        quantity
      })
      await getInventory() // Always refresh after successful update
    } catch (error) {
      console.error('Error updating inventory item:', error)
      throw error
    }
  }

  const deleteInventoryItem = async (id: number) => {
    try {
      await axios.delete(`/api/inventory/${id}`)
      await getInventory() // Always refresh after successful delete
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      throw error
    }
  }

  const updatePotionInventoryItem = async (id: number, quantity: number) => {
    try {
      await axios.put(`/api/inventory/potion/${id}`, {
        quantity
      })
      await getInventory() // Always refresh after successful update
    } catch (error) {
      console.error('Error updating potion inventory item:', error)
      throw error
    }
  }

  const updateItemInventoryItem = async (id: number, quantity: number) => {
    try {
      await axios.put(`/api/inventory/item/${id}`, {
        quantity
      })
      await getInventory() // Always refresh after successful update
    } catch (error: unknown) {
      logStoreError('Inventory Store', `updating item quantity (ID: ${id})`, error)
      throw error
    }
  }

  const deletePotionFromInventory = async (id: number) => {
    try {
      await axios.delete(`/api/inventory/potion/${id}`)
      await getInventory() // Always refresh after successful delete
    } catch (error: unknown) {
      logStoreError('Inventory Store', `deleting potion from inventory (ID: ${id})`, error)
      throw error
    }
  }

  const deleteItemFromInventory = async (id: number) => {
    try {
      await axios.delete(`/api/inventory/item/${id}`)
      await getInventory() // Always refresh after successful delete
    } catch (error: unknown) {
      logStoreError('Inventory Store', `deleting item from inventory (ID: ${id})`, error)
      throw error
    }
  }

  const addCurrency = async (name: string, value: number) => {
    try {
      await axios.post('/api/inventory/currency', {
        name,
        value
      })
      await getInventory() // Always refresh after successful add
    } catch (error: unknown) {
      logStoreError('Inventory Store', `adding currency (${name} = ${value})`, error)
      throw error
    }
  }

  const updateCurrency = async (id: number, value: number) => {
    try {
      await axios.put(`/api/inventory/currency/${id}`, {
        value
      })
      await getInventory() // Always refresh after successful update
    } catch (error: unknown) {
      logStoreError('Inventory Store', `updating currency (ID: ${id}, value: ${value})`, error)
      throw error
    }
  }

  const deleteCurrency = async (id: number) => {
    try {
      const response = await axios.delete(`/api/inventory/currency/${id}`)

      if (response.status === 204) {
        await getInventory()
      }
    } catch (error: unknown) {
      logStoreError('Inventory Store', `deleting currency (ID: ${id})`, error)
      throw error
    }
  }

  const addItemToInventory = async (itemData: { name: string; description: string; quantity?: number }) => {
    try {
      await axios.post('/api/inventory/item', {
        name: itemData.name,
        description: itemData.description,
        quantity: itemData.quantity || 1
      })
      await getInventory() // Always refresh after successful add
    } catch (error: unknown) {
      logStoreError('Inventory Store', `adding item to inventory (${itemData.name})`, error)
      throw error
    }
  }

  // Computed properties
  const totalCurrencyValue = computed(() => {
    return currencies.value.reduce((total, currency) => total + currency.value, 0)
  })

  const hqIngredients = computed(() => {
    return inventoryItems.value.filter(item => item.quality === 'HQ')
  })

  const normalIngredients = computed(() => {
    return inventoryItems.value.filter(item => item.quality === 'NORMAL')
  })

  return {
    // State
    inventoryItems,
    potionItems,
    itemItems,
    currencies,
    // Actions
    addToInventory,
    getInventory,
    updateInventoryItem,
    deleteInventoryItem,
    updatePotionInventoryItem,
    updateItemInventoryItem,
    deletePotionFromInventory,
    deleteItemFromInventory,
    addItemToInventory,
    addCurrency,
    updateCurrency,
    deleteCurrency,
    // Computed
    totalCurrencyValue,
    hqIngredients,
    normalIngredients
  }
})
