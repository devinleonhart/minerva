export interface CraftPotionRequest {
  recipeId: number
  quality: string
  essenceType?: string
  ingredientSelections: Array<{
    ingredientId: number
    inventoryItemId: number
    quantity: number
  }>
}

export interface RecipeCraftability {
  recipeId: number
  recipeName: string
  isCraftable: boolean
  ingredients: Array<{
    ingredientId: number
    ingredientName: string
    requiredQuantity: number
    availableQuantity: number
    isCraftable: boolean
    availableOptions: Array<{
      inventoryItemId: number
      quality: string
      quantity: number
      totalAvailable: number
    }>
  }>
  cauldronVariants: Array<{
    essenceType: string
    variantName: string
    essenceIngredientId: number
    essenceIngredientName: string
    essenceAvailable: number
    isAvailable: boolean
  }>
}

export interface PotionStore {
  craftability: RecipeCraftability | null
}
