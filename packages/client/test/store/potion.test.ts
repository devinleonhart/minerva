import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { usePotionStore } from '../../src/store/potion'
import { createMockAxiosResponse, mockAxiosError } from '../setup'

const mockedAxios = vi.mocked(axios)

describe('Potion Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  describe('checkRecipeCraftability', () => {
    it('checks recipe craftability successfully', async () => {
      const recipeId = 1
      const mockCraftability = {
        canCraft: true,
        missingIngredients: [],
        totalCost: 150
      }

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockCraftability))

      const store = usePotionStore()
      const result = await store.checkRecipeCraftability(recipeId)

      expect(result).toEqual(mockCraftability)
      expect(store.craftability).toEqual(mockCraftability)
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/recipes/${recipeId}/craftable`)
    })

    it('handles uncraftable recipes', async () => {
      const recipeId = 2
      const mockCraftability = {
        canCraft: false,
        missingIngredients: [
          { ingredientId: 1, name: 'Rare Herb', required: 2, available: 0 }
        ],
        totalCost: 0
      }

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockCraftability))

      const store = usePotionStore()
      const result = await store.checkRecipeCraftability(recipeId)

      expect(result).toEqual(mockCraftability)
      expect(store.craftability).toEqual(mockCraftability)
      expect(result.canCraft).toBe(false)
      expect(result.missingIngredients).toHaveLength(1)
    })

    it('handles API errors', async () => {
      const recipeId = 999
      mockedAxios.get.mockRejectedValue(mockAxiosError('Recipe not found', 404))

      const store = usePotionStore()

      await expect(store.checkRecipeCraftability(recipeId)).rejects.toThrow('Recipe not found')
    })
  })

  describe('craftPotion', () => {
    it('crafts a potion successfully', async () => {
      const craftRequest = {
        recipeId: 1,
        ingredientSelections: [
          { ingredientId: 1, inventoryItemId: 101, quantity: 2 },
          { ingredientId: 2, inventoryItemId: 102, quantity: 1 }
        ]
      }

      const craftedPotion = {
        id: 1,
        recipe: { id: 1, name: 'Healing Potion' },
        quality: 'NORMAL',
        createdAt: new Date().toISOString()
      }

      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(craftedPotion))

      const store = usePotionStore()
      // Set initial craftability state
      store.craftability = { canCraft: true, missingIngredients: [], totalCost: 150 }

      const result = await store.craftPotion(craftRequest)

      expect(result).toEqual(craftedPotion)
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/potions/', craftRequest)
      expect(store.craftability).toBeNull() // Should be reset after crafting
    })

    it('handles crafting errors', async () => {
      const craftRequest = {
        recipeId: 999,
        ingredientSelections: []
      }

      mockedAxios.post.mockRejectedValue(mockAxiosError('Recipe not found', 404))

      const store = usePotionStore()

      await expect(store.craftPotion(craftRequest)).rejects.toThrow('Recipe not found')
    })

    it('resets craftability state after successful crafting', async () => {
      const craftRequest = {
        recipeId: 1,
        ingredientSelections: [
          { ingredientId: 1, inventoryItemId: 101, quantity: 1 }
        ]
      }

      const craftedPotion = { id: 1, recipe: { id: 1, name: 'Test Potion' } }
      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(craftedPotion))

      const store = usePotionStore()
      store.craftability = { canCraft: true, missingIngredients: [], totalCost: 100 }

      await store.craftPotion(craftRequest)

      expect(store.craftability).toBeNull()
    })
  })

  describe('state management', () => {
    it('initializes with null craftability', () => {
      const store = usePotionStore()
      expect(store.craftability).toBeNull()
    })

    it('updates craftability state correctly', async () => {
      const recipeId = 1
      const mockCraftability = { canCraft: true, missingIngredients: [], totalCost: 100 }

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockCraftability))

      const store = usePotionStore()
      await store.checkRecipeCraftability(recipeId)

      expect(store.craftability).toEqual(mockCraftability)
    })
  })

  describe('error handling', () => {
    it('logs errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.get.mockRejectedValue(new Error('Network error'))

      const store = usePotionStore()

      await expect(store.checkRecipeCraftability(1)).rejects.toThrow('Network error')
      expect(consoleSpy).toHaveBeenCalledWith('Error checking recipe craftability:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('addPotionDirectly', () => {
    it('adds potion directly without ingredients', async () => {
      const request = { recipeId: 1, quality: 'HQ' }
      const mockPotion = {
        id: 1,
        recipeId: 1,
        quality: 'HQ',
        createdAt: '2023-01-01T00:00:00Z',
        inventoryItems: [{ id: 1, quantity: 1 }]
      }

      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(mockPotion, 201))

      const store = usePotionStore()
      const result = await store.addPotionDirectly(request)

      expect(result).toEqual(mockPotion)
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/potions/direct', request)
    })

    it('handles direct potion creation errors', async () => {
      const request = { recipeId: 999, quality: 'NORMAL' }
      mockedAxios.post.mockRejectedValue(mockAxiosError('Recipe not found', 404))

      const store = usePotionStore()

      await expect(store.addPotionDirectly(request)).rejects.toThrow('Recipe not found')
    })
  })
})
