import { defineStore } from 'pinia'
import axios from 'axios'

import type { Recipe, CreateRecipeRequest, UpdateRecipeRequest, RecipeDeletability } from '../types/store/recipe'

export const useRecipeStore = defineStore('recipe', {
  state: () => ({
    recipes: [] as Recipe[]
  }),
  actions: {
    async getRecipes() {
      try {
        const response = await axios.get('/api/recipes/')
        this.recipes = response.data
      } catch (error) {
        console.error('Error fetching recipes:', error)
        return []
      }
    },
    async createRecipe(request: CreateRecipeRequest) {
      try {
        const response = await axios.post('/api/recipes/', request)
        await this.getRecipes()
        return response.data
      } catch (error) {
        console.error('Error creating recipe:', error)
        throw error
      }
    },
    async updateRecipe(id: number, updates: UpdateRecipeRequest) {
      try {
        const response = await axios.put(`/api/recipes/${id}`, updates)
        await this.getRecipes()
        return response.data
      } catch (error) {
        console.error('Error updating recipe:', error)
        throw error
      }
    },
    async deleteRecipe(id: number) {
      try {
        await axios.delete(`/api/recipes/${id}`)
        await this.getRecipes()
      } catch (error) {
        console.error('Error deleting recipe:', error)
        throw error
      }
    },
    async checkRecipeDeletability(id: number): Promise<RecipeDeletability> {
      try {
        const response = await axios.get(`/api/recipes/${id}/deletable`)
        return response.data
      } catch (error) {
        console.error('Error checking recipe deletability:', error)
        return { canDelete: false, reason: 'Error checking deletability' }
      }
    }
  },
  getters: {
    // Add any computed properties if needed
  }
})
