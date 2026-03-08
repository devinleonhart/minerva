export interface PersonNotableEvent {
  id: number
  personId: number
  description: string
  createdAt: string
  updatedAt: string
}

export interface Person {
  id: number
  name: string
  description: string | null
  relationship: string | null
  notableEvents: PersonNotableEvent[]
  url: string | null
  isFavorited: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePersonRequest {
  name: string
  description?: string | null
  relationship?: string | null
  notableEvents?: string[]
  url?: string | null
}

export interface UpdatePersonRequest {
  name?: string
  description?: string | null
  relationship?: string | null
  notableEvents?: string[]
  url?: string | null
  isFavorited?: boolean
}

export interface PeopleStore {
  people: Person[]
}
