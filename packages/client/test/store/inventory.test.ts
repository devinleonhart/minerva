import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useInventoryStore } from '../../src/store/inventory'
import { createMockAxiosResponse, mockAxiosError } from '../setup'

const mockedAxios = vi.mocked(axios)

describe('Inventory Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  describe('getInventory', () => {
    it('fetches complete inventory data', async () => {
      const mockInventory = {
        ingredients: [
          { id: 1, quantity: 5, quality: 'HQ', ingredient: { id: 1, name: 'Herb' } }
        ],
        potions: [
          { id: 1, quantity: 2, potion: { id: 1, recipe: { name: 'Healing Potion' } } }
        ],
        items: [
          { id: 1, quantity: 3, item: { id: 1, name: 'Sword' } }
        ],
        currencies: [
          { id: 1, name: 'Gold', value: 100 }
        ]
      }

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockInventory))

      const store = useInventoryStore()
      await store.getInventory()

      expect(store.inventoryItems).toEqual(mockInventory.ingredients)
      expect(store.potionItems).toEqual(mockInventory.potions)
      expect(store.itemItems).toEqual(mockInventory.items)
      expect(store.currencies).toEqual(mockInventory.currencies)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/inventory')
    })

    it('handles empty inventory gracefully', async () => {
      const emptyInventory = {
        ingredients: [],
        potions: [],
        items: [],
        currencies: []
      }

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(emptyInventory))

      const store = useInventoryStore()
      await store.getInventory()

      expect(store.inventoryItems).toEqual([])
      expect(store.potionItems).toEqual([])
      expect(store.itemItems).toEqual([])
      expect(store.currencies).toEqual([])
    })
  })

  describe('addToInventory', () => {
    it('adds ingredient to inventory', async () => {
      const newItem = { ingredientId: 1, quantity: 5, quality: 'NORMAL' }
      const createdItem = { id: 1, ...newItem, ingredient: { id: 1, name: 'Herb' } }

      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(createdItem))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse({
        ingredients: [createdItem],
        potions: [],
        items: [],
        currencies: []
      }))

      const store = useInventoryStore()
      await store.addToInventory(newItem)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/inventory', newItem)
    })

    it('handles invalid ingredient ID', async () => {
      const invalidItem = { ingredientId: 999, quantity: 1, quality: 'NORMAL' }

      mockedAxios.post.mockRejectedValue(mockAxiosError('Ingredient not found', 404))

      const store = useInventoryStore()

      await expect(store.addToInventory(invalidItem)).rejects.toThrow('Ingredient not found')
    })

    it('validates quantity values', async () => {
      const invalidItem = { ingredientId: 1, quantity: -1, quality: 'NORMAL' }

      mockedAxios.post.mockRejectedValue(mockAxiosError('Quantity must be positive', 400))

      const store = useInventoryStore()

      await expect(store.addToInventory(invalidItem)).rejects.toThrow('Quantity must be positive')
    })
  })

  describe('updateInventoryItem', () => {
    it('updates inventory item quantity', async () => {
      const itemId = 1
      const quality = 'NORMAL'
      const quantity = 10
      const updatedItem = { id: itemId, quality, quantity, ingredient: { id: 1, name: 'Herb' } }

      mockedAxios.put.mockResolvedValue(createMockAxiosResponse(updatedItem))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse({
        inventoryItems: [updatedItem],
        potionItems: [],
        itemItems: [],
        currencies: []
      }))

      const store = useInventoryStore()
      await store.updateInventoryItem(itemId, quality, quantity)

      expect(mockedAxios.put).toHaveBeenCalledWith(`/api/inventory/${itemId}`, { quality, quantity })
    })

    it('updates inventory item quality', async () => {
      const itemId = 1
      const quality = 'HQ'
      const quantity = 5
      const updatedItem = { id: itemId, quantity, quality, ingredient: { id: 1, name: 'Herb' } }

      mockedAxios.put.mockResolvedValue(createMockAxiosResponse(updatedItem))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse({
        inventoryItems: [updatedItem],
        potionItems: [],
        itemItems: [],
        currencies: []
      }))

      const store = useInventoryStore()
      await store.updateInventoryItem(itemId, quality, quantity)

      expect(mockedAxios.put).toHaveBeenCalledWith(`/api/inventory/${itemId}`, { quality, quantity })
    })
  })

  describe('deleteInventoryItem', () => {
    it('deletes inventory item', async () => {
      const itemId = 1

      mockedAxios.delete.mockResolvedValue(createMockAxiosResponse(null, 204))

      const store = useInventoryStore()
      await store.deleteInventoryItem(itemId)

      expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/inventory/${itemId}`)
    })

    it('handles deletion of non-existent item', async () => {
      const itemId = 999

      mockedAxios.delete.mockRejectedValue(mockAxiosError('Inventory item not found', 404))

      const store = useInventoryStore()

      await expect(store.deleteInventoryItem(itemId)).rejects.toThrow('Inventory item not found')
    })
  })

  describe('currency operations', () => {
    it('adds currency to inventory', async () => {
      const name = 'Silver'
      const value = 50
      const createdCurrency = { id: 2, name, value }

      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(createdCurrency))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse({
        inventoryItems: [],
        potionItems: [],
        itemItems: [],
        currencies: [createdCurrency]
      }))

      const store = useInventoryStore()
      await store.addCurrency(name, value)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/inventory/currency', { name, value })
    })

    it('updates currency value', async () => {
      const currencyId = 1
      const value = 150
      const updatedCurrency = { id: currencyId, name: 'Gold', value }

      mockedAxios.put.mockResolvedValue(createMockAxiosResponse(updatedCurrency))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse({
        ingredients: [],
        potions: [],
        items: [],
        currencies: [updatedCurrency]
      }))

      const store = useInventoryStore()
      await store.updateCurrency(currencyId, value)

      expect(mockedAxios.put).toHaveBeenCalledWith(`/api/inventory/currency/${currencyId}`, { value })
    })

    it('deletes currency', async () => {
      const currencyId = 1

      mockedAxios.delete.mockResolvedValue(createMockAxiosResponse(null, 204))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse({
        ingredients: [],
        potions: [],
        items: [],
        currencies: []
      }))

      const store = useInventoryStore()
      await store.deleteCurrency(currencyId)

      expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/inventory/currency/${currencyId}`)
    })

    it('validates currency name uniqueness', async () => {
      const duplicateCurrency = { name: 'Gold', value: 100 }

      mockedAxios.post.mockRejectedValue(mockAxiosError('A currency with this name already exists', 409))

      const store = useInventoryStore()

      await expect(store.addCurrency(duplicateCurrency.name, duplicateCurrency.value)).rejects.toThrow('A currency with this name already exists')
    })
  })

  describe('getters and computed values', () => {
    it('calculates total inventory value correctly', async () => {
      const mockInventory = {
        ingredients: [
          { id: 1, quantity: 5, quality: 'HQ', ingredient: { id: 1, name: 'Herb' } }
        ],
        potions: [
          { id: 1, quantity: 2, potion: { id: 1, recipe: { name: 'Healing Potion' } } }
        ],
        items: [
          { id: 1, quantity: 3, item: { id: 1, name: 'Sword' } }
        ],
        currencies: [
          { id: 1, name: 'Gold', value: 100 },
          { id: 2, name: 'Silver', value: 50 }
        ]
      }

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockInventory))

      const store = useInventoryStore()
      await store.getInventory()

      expect(store.totalCurrencyValue).toBe(150) // 100 + 50
    })

    it('groups items by quality', async () => {
      const mockInventory = {
        ingredients: [
          { id: 1, quantity: 5, quality: 'HQ', ingredient: { id: 1, name: 'Herb A' } },
          { id: 2, quantity: 3, quality: 'NORMAL', ingredient: { id: 2, name: 'Herb B' } },
          { id: 3, quantity: 2, quality: 'HQ', ingredient: { id: 3, name: 'Herb C' } }
        ],
        potions: [],
        items: [],
        currencies: []
      }

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockInventory))

      const store = useInventoryStore()
      await store.getInventory()

      expect(store.hqIngredients).toHaveLength(2)
      expect(store.normalIngredients).toHaveLength(1)
      expect(store.hqIngredients.every(item => item.quality === 'HQ')).toBe(true)
    })
  })
})
