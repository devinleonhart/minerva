import type { Recipe } from '#/prisma'

export interface CreateRecipeRequest {
  name: string
  description: string
  ingredientIds: number[]
}

export interface UpdateRecipeRequest {
  name?: string
  description?: string
  ingredientIds?: number[]
}

export interface RecipeStore {
  recipes: Recipe[]
}
