export interface Recipe {
  id: number
  name: string
  description: string
  potionId: number
  createdAt: string
  updatedAt: string
  cauldronName?: string | null
  fireEssence?: string | null
  airEssence?: string | null
  waterEssence?: string | null
  lightningEssence?: string | null
  earthEssence?: string | null
  lifeEssence?: string | null
  deathEssence?: string | null
  ingredients: RecipeIngredient[]
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

export interface CreateRecipeRequest {
  name: string
  description: string
  ingredients: Array<{ ingredientId: number; quantity: number }>
  cauldronName?: string
  fireEssence?: string
  airEssence?: string
  waterEssence?: string
  lightningEssence?: string
  earthEssence?: string
  lifeEssence?: string
  deathEssence?: string
}

export interface UpdateRecipeRequest {
  name?: string
  description?: string
  ingredients?: Array<{ ingredientId: number; quantity: number }>
  cauldronName?: string
  fireEssence?: string
  airEssence?: string
  waterEssence?: string
  lightningEssence?: string
  earthEssence?: string
  lifeEssence?: string
  deathEssence?: string
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
