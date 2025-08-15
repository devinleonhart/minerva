import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useRecipeStore } from '../../src/store/recipe'
import { createMockAxiosResponse, mockAxiosError } from '../setup'

const mockedAxios = vi.mocked(axios)

describe('Recipe Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  describe('getRecipes', () => {
    it('fetches recipes and sets state', async () => {
      const mockRecipes = [
        { id: 1, name: 'Healing Potion', description: 'Restores health' },
        { id: 2, name: 'Mana Potion', description: 'Restores mana' }
      ]

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockRecipes))

      const store = useRecipeStore()
      await store.getRecipes()

      expect(store.recipes).toEqual(mockRecipes)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/recipes/')
    })

    it('handles empty recipes list', async () => {
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([]))

      const store = useRecipeStore()
      await store.getRecipes()

      expect(store.recipes).toEqual([])
    })

    it('handles API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(mockAxiosError('Failed to fetch recipes', 500))

      const store = useRecipeStore()
      const result = await store.getRecipes()

      expect(result).toEqual([])
      expect(store.recipes).toEqual([])
    })
  })

  describe('createRecipe', () => {
    it('creates a new recipe successfully', async () => {
      const newRecipe = {
        name: 'New Potion',
        description: 'A new magical potion',
        ingredients: [
          { ingredientId: 1, quantity: 2 },
          { ingredientId: 2, quantity: 1 }
        ]
      }

      const createdRecipe = { id: 3, ...newRecipe }
      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(createdRecipe))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([createdRecipe]))

      const store = useRecipeStore()
      const result = await store.createRecipe(newRecipe)

      expect(result).toEqual(createdRecipe)
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/recipes/', newRecipe)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/recipes/')
      expect(store.recipes).toEqual([createdRecipe])
    })

    it('creates a recipe with cauldron essences', async () => {
      const newRecipe = {
        name: 'Crystal Cauldron Potion',
        description: 'A potion enhanced with essence magic',
        ingredients: [{ ingredientId: 1, quantity: 1 }],
        cauldronName: 'Essence of Life',
        fireEssence: 'Burns enemies on impact',
        waterEssence: 'Heals over time',
        lifeEssence: 'Grants temporary life boost'
      }

      const createdRecipe = { id: 3, ...newRecipe }
      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(createdRecipe))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([createdRecipe]))

      const store = useRecipeStore()
      const result = await store.createRecipe(newRecipe)

      expect(result).toEqual(createdRecipe)
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/recipes/', newRecipe)
      expect(store.recipes).toEqual([createdRecipe])
    })

    it('handles creation errors', async () => {
      const newRecipe = { name: 'Invalid Recipe' }
      mockedAxios.post.mockRejectedValue(mockAxiosError('Recipe creation failed', 400))

      const store = useRecipeStore()

      await expect(store.createRecipe(newRecipe)).rejects.toThrow('Recipe creation failed')
    })
  })

  describe('updateRecipe', () => {
    it('updates an existing recipe successfully', async () => {
      const recipeId = 1
      const updates = { name: 'Updated Potion', description: 'Updated description' }
      const updatedRecipe = { id: recipeId, ...updates }

      mockedAxios.put.mockResolvedValue(createMockAxiosResponse(updatedRecipe))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([updatedRecipe]))

      const store = useRecipeStore()
      const result = await store.updateRecipe(recipeId, updates)

      expect(result).toEqual(updatedRecipe)
      expect(mockedAxios.put).toHaveBeenCalledWith(`/api/recipes/${recipeId}`, updates)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/recipes/')
    })

    it('updates recipe with cauldron essences', async () => {
      const recipeId = 1
      const updates = {
        name: 'Enhanced Potion',
        cauldronName: 'Storm\'s Fury',
        lightningEssence: 'Adds electrical damage',
        airEssence: 'Increases movement speed'
      }
      const updatedRecipe = { id: recipeId, ...updates }

      mockedAxios.put.mockResolvedValue(createMockAxiosResponse(updatedRecipe))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([updatedRecipe]))

      const store = useRecipeStore()
      const result = await store.updateRecipe(recipeId, updates)

      expect(result).toEqual(updatedRecipe)
      expect(mockedAxios.put).toHaveBeenCalledWith(`/api/recipes/${recipeId}`, updates)
    })

    it('handles update errors', async () => {
      const recipeId = 999
      const updates = { name: 'Non-existent Recipe' }
      mockedAxios.put.mockRejectedValue(mockAxiosError('Recipe not found', 404))

      const store = useRecipeStore()

      await expect(store.updateRecipe(recipeId, updates)).rejects.toThrow('Recipe not found')
    })
  })

  describe('deleteRecipe', () => {
    it('deletes a recipe successfully', async () => {
      const recipeId = 1

      mockedAxios.delete.mockResolvedValue(createMockAxiosResponse(null, 204))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([]))

      const store = useRecipeStore()
      await store.deleteRecipe(recipeId)

      expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/recipes/${recipeId}`)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/recipes/')
      expect(store.recipes).toEqual([])
    })

    it('handles deletion errors', async () => {
      const recipeId = 999
      mockedAxios.delete.mockRejectedValue(mockAxiosError('Recipe not found', 404))

      const store = useRecipeStore()

      await expect(store.deleteRecipe(recipeId)).rejects.toThrow('Recipe not found')
    })
  })

  describe('error handling', () => {
    it('logs errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.get.mockRejectedValue(new Error('Network error'))

      const store = useRecipeStore()
      await store.getRecipes()

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching recipes:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })
})
