import type { Recipe } from '#/prisma'

export interface CreateRecipeRequest {
  name: string
  description: string
  ingredients: Array<{
    ingredientId: number
    quantity: number
  }>
}

export interface UpdateRecipeRequest {
  name?: string
  description?: string
  ingredients?: Array<{
    ingredientId: number
    quantity: number
  }>
}

export interface RecipeStore {
  recipes: Recipe[]
}
