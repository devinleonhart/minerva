import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useItemStore } from '../../src/store/item'
import { createMockAxiosResponse, mockAxiosError } from '../setup'

const mockedAxios = vi.mocked(axios)

describe('Item Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  describe('getItems', () => {
    it('fetches items and sets state', async () => {
      const mockItems = [
        { id: 1, name: 'Magic Sword', description: 'A powerful weapon' },
        { id: 2, name: 'Shield', description: 'Protective gear' }
      ]

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockItems))

      const store = useItemStore()
      const result = await store.getItems()

      expect(result).toEqual(mockItems)
      expect(store.items).toEqual(mockItems)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/items/')
    })

    it('handles empty items list', async () => {
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([]))

      const store = useItemStore()
      const result = await store.getItems()

      expect(result).toEqual([])
      expect(store.items).toEqual([])
    })

    it('handles API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(mockAxiosError('Failed to fetch items', 500))

      const store = useItemStore()
      const result = await store.getItems()

      expect(result).toEqual([])
      expect(store.items).toEqual([])
    })
  })

  describe('createItem', () => {
    it('creates a new item successfully', async () => {
      const newItem = {
        name: 'New Item',
        description: 'A new magical item'
      }

      const createdItem = { id: 3, ...newItem }
      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(createdItem))

      const store = useItemStore()
      const result = await store.createItem(newItem)

      expect(result).toEqual(createdItem)
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/items/', newItem)
    })

    it('handles creation errors', async () => {
      const newItem = { name: 'Invalid Item' }
      mockedAxios.post.mockRejectedValue(mockAxiosError('Item creation failed', 400))

      const store = useItemStore()

      await expect(store.createItem(newItem)).rejects.toThrow('Item creation failed')
    })
  })

  describe('deleteItem', () => {
    it('deletes an item successfully', async () => {
      const itemId = 1

      mockedAxios.delete.mockResolvedValue(createMockAxiosResponse(null, 204))

      const store = useItemStore()
      await store.deleteItem(itemId)

      expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/items/${itemId}`)
    })

    it('handles deletion of item in inventory', async () => {
      const itemId = 2
      const apiError = {
        response: {
          data: {
            code: 'ITEM_IN_INVENTORY'
          }
        }
      }

      mockedAxios.delete.mockRejectedValue(apiError)

      const store = useItemStore()

      await expect(store.deleteItem(itemId)).rejects.toThrow('Cannot delete item that has inventory items')
    })

    it('handles other deletion errors', async () => {
      const itemId = 999
      mockedAxios.delete.mockRejectedValue(mockAxiosError('Item not found', 404))

      const store = useItemStore()

      await expect(store.deleteItem(itemId)).rejects.toThrow('Item not found')
    })
  })

  describe('checkItemDeletability', () => {
    it('checks deletability successfully for deletable item', async () => {
      const itemId = 1
      const mockDeletability = {
        canDelete: true,
        reason: null
      }

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockDeletability))

      const store = useItemStore()
      const result = await store.checkItemDeletability(itemId)

      expect(result).toEqual(mockDeletability)
      expect(result.canDelete).toBe(true)
      expect(mockedAxios.get).toHaveBeenCalledWith(`/api/items/${itemId}/deletable`)
    })

    it('checks deletability for non-deletable item', async () => {
      const itemId = 2
      const mockDeletability = {
        canDelete: false,
        reason: 'Item has associated inventory items'
      }

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockDeletability))

      const store = useItemStore()
      const result = await store.checkItemDeletability(itemId)

      expect(result).toEqual(mockDeletability)
      expect(result.canDelete).toBe(false)
      expect(result.reason).toBe('Item has associated inventory items')
    })

    it('handles API errors gracefully', async () => {
      const itemId = 999
      mockedAxios.get.mockRejectedValue(mockAxiosError('Failed to check deletability', 500))

      const store = useItemStore()
      const result = await store.checkItemDeletability(itemId)

      expect(result).toEqual({
        canDelete: false,
        reason: 'Error checking deletability'
      })
    })
  })

  describe('state management', () => {
    it('initializes with empty items array', () => {
      const store = useItemStore()
      expect(store.items).toEqual([])
    })

    it('updates items state after fetching', async () => {
      const mockItems = [{ id: 1, name: 'Test Item' }]
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockItems))

      const store = useItemStore()
      await store.getItems()

      expect(store.items).toEqual(mockItems)
    })
  })

  describe('error handling', () => {
    it('logs errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.get.mockRejectedValue(new Error('Network error'))

      const store = useItemStore()
      await store.getItems()

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching data:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('logs item creation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.post.mockRejectedValue(new Error('Creation failed'))

      const store = useItemStore()

      await expect(store.createItem({ name: 'Test' })).rejects.toThrow('Creation failed')
      expect(consoleSpy).toHaveBeenCalledWith('Error creating item:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('logs deletability check errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.get.mockRejectedValue(new Error('Check failed'))

      const store = useItemStore()
      await store.checkItemDeletability(1)

      expect(consoleSpy).toHaveBeenCalledWith('Error checking item deletability:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })
})
