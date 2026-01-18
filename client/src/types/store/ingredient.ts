export interface Ingredient {
  id: number
  name: string
  description: string
  secured: boolean
  createdAt: string
  updatedAt: string
}

export interface IngredientForm {
  name: string
  description: string
}

export interface UpdateIngredientRequest {
  name: string
  description: string
}

export interface IngredientDeletability {
  canDelete: boolean
  reason: string | null
}

export interface IngredientStore {
  ingredients: Ingredient[]
}
