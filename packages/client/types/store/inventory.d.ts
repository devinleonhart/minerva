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

export interface InventoryStore {
  inventoryItems: InventoryItem[]
}

export interface AddToInventoryRequest {
  ingredientId: number
  quantity?: number
}

export interface UpdateInventoryRequest {
  quality?: 'NORMAL' | 'HQ' | 'LQ'
  quantity?: number
}
