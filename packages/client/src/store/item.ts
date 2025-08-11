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
    async getItems() {
      try {
        const response = await axios.get('/api/items/')
        this.items = response.data
        return response.data
      } catch (error) {
        console.error('Error fetching items:', error)
        return []
      }
    }
  }
})
