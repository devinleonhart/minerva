export interface Skill {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface CreateSkillRequest {
  name: string
}

export interface SkillsStore {
  skills: Skill[]
}
