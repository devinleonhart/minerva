export interface InventoryItem {
  id: number
  ingredientId: number
  ingredient: {
    id: number
    name: string
    description: string
    secured: boolean
  }
  quality: IngredientQuality
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface PotionInventoryItem {
  id: number
  potionId: number
  potion: {
    id: number
    name: string
    description: string
    quality: PotionQuality
    recipe: {
      id: number
      name: string
      description: string
      cauldronName?: string | null
      fireEssence?: string | null
      airEssence?: string | null
      waterEssence?: string | null
      lightningEssence?: string | null
      earthEssence?: string | null
      lifeEssence?: string | null
      deathEssence?: string | null
    }
  }
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface ItemInventoryItem {
  id: number
  itemId: number
  item: {
    id: number
    name: string
    description: string
  }
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface Currency {
  id: number
  name: string
  value: number
  createdAt: string
  updatedAt: string
}

export interface AddToInventoryRequest {
  ingredientId: number
  quality: IngredientQuality
  quantity: number
}

export interface UpdateInventoryRequest {
  quality?: IngredientQuality
  quantity?: number
}

export interface UpdatePotionInventoryRequest {
  quality?: PotionQuality
  quantity?: number
}

export interface AddCurrencyRequest {
  name: string
  value: number
}

export interface UpdateCurrencyRequest {
  value: number
}

export interface InventoryStore {
  inventoryItems: InventoryItem[]
  potionItems: PotionInventoryItem[]
  itemItems: ItemInventoryItem[]
  currencies: Currency[]
}

export type IngredientQuality = 'NORMAL' | 'HQ' | 'LQ'
export type PotionQuality = 'NORMAL' | 'HQ' | 'LQ'
