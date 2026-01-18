import type { Ingredient } from '#/prisma'

export interface IngredientForm {
    name: string
    description: string
  }

export interface IngredientStore {
    ingredients: Ingredient[]
}
