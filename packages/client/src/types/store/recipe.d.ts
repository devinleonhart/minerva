export interface Recipe {
  id: number
  name: string
  description: string
  potionId: number
  createdAt: string
  updatedAt: string
  ingredients: RecipeIngredient[]
}

export interface RecipeIngredient {
  recipeId: number
  ingredientId: number
  ingredient: {
    id: number
    name: string
    description: string
    secured: boolean
    createdAt: string
    updatedAt: string
  }
}

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
