import { defineStore } from 'pinia'
import axios from 'axios'

export interface CraftPotionRequest {
  recipeId: number
  ingredientSelections: Array<{
    ingredientId: number
    inventoryItemId: number
    quantity: number
  }>
}

export interface RecipeCraftability {
  recipeId: number
  recipeName: string
  isCraftable: boolean
  ingredients: Array<{
    ingredientId: number
    ingredientName: string
    requiredQuantity: number
    availableQuantity: number
    isCraftable: boolean
    availableOptions: Array<{
      inventoryItemId: number
      quality: string
      quantity: number
      totalAvailable: number
    }>
  }>
}

export interface PotionStore {
  craftability: RecipeCraftability | null
}

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
        // Reset craftability after successful crafting
        this.craftability = null
        return response.data
      } catch (error) {
        console.error('Error crafting potion:', error)
        throw error
      }
    }
  }
})
