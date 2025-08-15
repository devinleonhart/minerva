export interface Person {
  id: number
  name: string
  description: string | null
  relationship: string | null
  notableEvents: string | null
  url: string | null
  isFavorited: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePersonRequest {
  name: string
  description?: string | null
  relationship?: string | null
  notableEvents?: string | null
  url?: string | null
}

export interface UpdatePersonRequest {
  name?: string
  description?: string | null
  relationship?: string | null
  notableEvents?: string | null
  url?: string | null
  isFavorited?: boolean
}

export interface PeopleStore {
  people: Person[]
}
