import { defineStore } from 'pinia'
import axios from 'axios'

import type { InventoryStore, AddToInventoryRequest, UpdateInventoryRequest, UpdatePotionInventoryRequest } from '#/store/inventory'

export const useInventoryStore = defineStore('inventory', {
  state: (): InventoryStore => ({
    inventoryItems: [],
    potionItems: [],
    itemItems: []
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
        this.inventoryItems = response.data.ingredients || []
        this.potionItems = response.data.potions || []
        this.itemItems = response.data.items || []
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
    },
    async updatePotionInventoryItem(id: number, updates: UpdatePotionInventoryRequest) {
      try {
        const response = await axios.put(`/api/inventory/potion/${id}`, updates)
        await this.getInventory()
        return response.data
      } catch (error) {
        console.error('Error updating potion inventory item:', error)
        throw error
      }
    },
    async deletePotionInventoryItem(id: number) {
      try {
        await axios.delete(`/api/inventory/potion/${id}`)
        await this.getInventory()
      } catch (error) {
        console.error('Error deleting potion from inventory:', error)
        throw error
      }
    },
    async deleteItemInventoryItem(id: number) {
      try {
        await axios.delete(`/api/inventory/item/${id}`)
        await this.getInventory()
      } catch (error) {
        console.error('Error deleting item from inventory:', error)
        throw error
      }
    }
  }
})
