export interface Spell {
  id: number
  name: string
  currentStars: number
  neededStars: number
  isLearned: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSpellRequest {
  name: string
  neededStars: number
  currentStars?: number
}

export interface UpdateSpellRequest {
  name?: string
  neededStars?: number
  currentStars?: number
}

export interface SpellsStore {
  spells: Spell[]
}
