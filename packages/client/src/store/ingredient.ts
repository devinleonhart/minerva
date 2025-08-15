import { defineStore } from 'pinia'
import axios from 'axios'

import type { IngredientForm, IngredientStore } from '#/store/ingredient'
import type { Prisma } from '#/prisma-types'

export interface IngredientDeletability {
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

export const useIngredientStore = defineStore('ingredient', {
  state: (): IngredientStore => ({
    ingredients: []
  }),
  actions: {
    async addIngredient(ingredient: IngredientForm) {
      try {
        await axios.post('/api/ingredients/', toIngredientCreateInput(ingredient))
      } catch (error) {
        console.error('Error adding ingredient:', error)
      }
    },
    async deleteIngredient(id: number) {
      try {
        await axios.delete(`/api/ingredients/${id}`)
      } catch (error: unknown) {
        const apiError = error as ApiError
        if (apiError.response?.data?.code === 'INGREDIENT_IN_USE') {
          throw new Error('Cannot delete ingredient that is used in recipes')
        } else if (apiError.response?.data?.code === 'INGREDIENT_IN_INVENTORY') {
          throw new Error('Cannot delete ingredient that has inventory items')
        }
        throw error
      }
    },
    async checkIngredientDeletability(id: number): Promise<IngredientDeletability> {
      try {
        const response = await axios.get(`/api/ingredients/${id}/deletable`)
        return response.data
      } catch (error) {
        console.error('Error checking ingredient deletability:', error)
        return { canDelete: false, reason: 'Error checking deletability' }
      }
    },
    async getIngredients() {
      try {
        const response = await axios.get('/api/ingredients/')
        this.ingredients = response.data
      } catch (error) {
        console.error('Error fetching data:', error)
        return []
      }
    }
  }
})

export const toIngredientCreateInput = (
  form: IngredientForm
): Prisma.IngredientCreateInput => ({
  name: form.name,
  description: form.description
})
