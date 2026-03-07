export interface Item {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface CreateItemRequest {
  name: string
  description: string
}

export interface ItemDeletability {
  canDelete: boolean
  reason: string | null
}

export interface ItemStore {
  items: Item[]
}
