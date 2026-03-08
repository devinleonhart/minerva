export interface RecipeCauldronVariant {
  id: number
  recipeId: number
  essenceType: string
  variantName: string
  description: string | null
  essenceIngredientId: number
  essenceIngredient: {
    id: number
    name: string
    description: string
    secured: boolean
    createdAt: string
    updatedAt: string
  }
  createdAt: string
  updatedAt: string
}

export interface Recipe {
  id: number
  name: string
  description: string
  potionId: number
  createdAt: string
  updatedAt: string
  ingredients: RecipeIngredient[]
  cauldronVariants: RecipeCauldronVariant[]
}

export interface RecipeIngredient {
  recipeId: number
  ingredientId: number
  quantity: number
  ingredient: {
    id: number
    name: string
    description: string
    secured: boolean
    createdAt: string
    updatedAt: string
  }
}

export interface CauldronVariantInput {
  essenceType: string
  variantName: string
  description: string
  essenceIngredientId: number
}

export interface CreateRecipeRequest {
  name: string
  description: string
  ingredients: Array<{ ingredientId: number; quantity: number }>
  cauldronVariants?: CauldronVariantInput[]
}

export interface UpdateRecipeRequest {
  name?: string
  description?: string
  ingredients?: Array<{ ingredientId: number; quantity: number }>
  cauldronVariants?: CauldronVariantInput[]
}

export interface RecipeDeletability {
  canDelete: boolean
  reason: string | null
}

export interface RecipeStore {
  recipes: Recipe[]
  getRecipes(): Promise<void>
  createRecipe(request: CreateRecipeRequest): Promise<Recipe>
  updateRecipe(id: number, updates: UpdateRecipeRequest): Promise<Recipe>
  deleteRecipe(id: number): Promise<void>
  checkRecipeDeletability(id: number): Promise<RecipeDeletability>
}
