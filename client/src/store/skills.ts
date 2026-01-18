import { defineStore } from 'pinia'
import axios from 'axios'

import type { SkillsStore, CreateSkillRequest } from '../types/store/skills'

export const useSkillsStore = defineStore('skills', {
  state: (): SkillsStore => ({
    skills: []
  }),
  actions: {
    async getSkills() {
      try {
        const response = await axios.get('/api/skills/')
        this.skills = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Error fetching skills:', error)
        console.warn('Keeping existing skills data due to fetch error')
      }
    },
    async createSkill(request: CreateSkillRequest) {
      try {
        const response = await axios.post('/api/skills/', request)
        await this.getSkills()
        return response.data
      } catch (error) {
        console.error('Error creating skill:', error)
        throw error
      }
    },
    async deleteSkill(id: number) {
      try {
        await axios.delete(`/api/skills/${id}`)
        await this.getSkills()
      } catch (error) {
        console.error('Error deleting skill:', error)
        throw error
      }
    }
  }
})
