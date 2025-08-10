import { defineStore } from 'pinia'
import axios from 'axios'

import type { IngredientForm, IngredientStore } from '#/store/ingredient'
import type { Prisma } from '#/prisma-types'

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
      } catch (error) {
        console.error('Error deleting ingredient:', error)
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
