import { defineStore } from 'pinia'
import axios from 'axios'

import type { InventoryStore, AddToInventoryRequest, UpdateInventoryRequest } from '#/store/inventory'

export const useInventoryStore = defineStore('inventory', {
  state: (): InventoryStore => ({
    inventoryItems: []
  }),
  actions: {
    async addToInventory(request: AddToInventoryRequest) {
      try {
        const response = await axios.post('/api/inventory/', request)
        await this.getInventory()
        return response.data
      } catch (error) {
        console.error('Error adding to inventory:', error)
        throw error
      }
    },
    async getInventory() {
      try {
        const response = await axios.get('/api/inventory/')
        this.inventoryItems = response.data
      } catch (error) {
        console.error('Error fetching inventory:', error)
        return []
      }
    },
    async updateInventoryItem(id: number, updates: UpdateInventoryRequest) {
      try {
        const response = await axios.put(`/api/inventory/${id}`, updates)
        await this.getInventory()
        return response.data
      } catch (error) {
        console.error('Error updating inventory item:', error)
        throw error
      }
    },
    async deleteInventoryItem(id: number) {
      try {
        await axios.delete(`/api/inventory/${id}`)
        await this.getInventory()
      } catch (error) {
        console.error('Error deleting inventory item:', error)
        throw error
      }
    }
  }
})
