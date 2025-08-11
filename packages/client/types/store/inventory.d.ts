export interface InventoryItem {
  id: number
  ingredientId: number
  ingredient: {
    id: number
    name: string
    description: string
    secured: boolean
    createdAt: string
    updatedAt: string
  }
  quality: 'NORMAL' | 'HQ' | 'LQ'
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface PotionInventoryItem {
  id: number
  potionId: number
  potion: {
    id: number
    quality: 'NORMAL' | 'HQ' | 'LQ'
    recipe: {
      id: number
      name: string
      description: string
    }
    createdAt: string
    updatedAt: string
  }
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface InventoryStore {
  inventoryItems: InventoryItem[]
  potionItems: PotionInventoryItem[]
}

export interface AddToInventoryRequest {
  ingredientId: number
  quantity?: number
}

export interface UpdateInventoryRequest {
  quality?: 'NORMAL' | 'HQ' | 'LQ'
  quantity?: number
}

export interface UpdatePotionInventoryRequest {
  quantity: number
}
