import { defineStore } from 'pinia'
import axios from 'axios'

export interface CreateItemRequest {
  name: string
  description: string
}

export interface Item {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface ItemDeletability {
  canDelete: boolean
  reason: string | null
}

interface ApiError {
  response?: {
    data?: {
      code?: string
    }
  }
}

export const useItemStore = defineStore('item', {
  state: () => ({
    items: [] as Item[]
  }),
  actions: {
    async createItem(request: CreateItemRequest) {
      try {
        const response = await axios.post('/api/items/', request)
        return response.data
      } catch (error) {
        console.error('Error creating item:', error)
        throw error
      }
    },
    async deleteItem(id: number) {
      try {
        await axios.delete(`/api/items/${id}`)
      } catch (error: unknown) {
        const apiError = error as ApiError
        if (apiError.response?.data?.code === 'ITEM_IN_INVENTORY') {
          throw new Error('Cannot delete item that has inventory items')
        }
        throw error
      }
    },
    async checkItemDeletability(id: number): Promise<ItemDeletability> {
      try {
        const response = await axios.get(`/api/items/${id}/deletable`)
        return response.data
      } catch (error) {
        console.error('Error checking item deletability:', error)
        return { canDelete: false, reason: 'Error checking deletability' }
      }
    },
    async getItems() {
      try {
        const response = await axios.get('/api/items/')
        this.items = response.data
        return response.data
      } catch (error) {
        console.error('Error fetching data:', error)
        return []
      }
    }
  }
})
