import { defineStore } from 'pinia'
import axios from 'axios'

import type { CraftPotionRequest, PotionStore } from '../types/store/potion'

export const usePotionStore = defineStore('potion', {
  state: (): PotionStore => ({
    craftability: null
  }),
  actions: {
    async checkRecipeCraftability(recipeId: number) {
      try {
        const response = await axios.get(`/api/recipes/${recipeId}/craftable`)
        this.craftability = response.data
        return response.data
      } catch (error) {
        console.error('Error checking recipe craftability:', error)
        throw error
      }
    },
    async craftPotion(request: CraftPotionRequest) {
      try {
        const response = await axios.post('/api/potions/', request)
        this.craftability = null
        return response.data
      } catch (error) {
        console.error('Error crafting potion:', error)
        throw error
      }
    },
    async addPotionDirectly(request: { recipeId: number; quality: string }) {
      try {
        const response = await axios.post('/api/potions/direct', request)
        return response.data
      } catch (error) {
        console.error('Error adding potion directly:', error)
        throw error
      }
    }
  }
})
