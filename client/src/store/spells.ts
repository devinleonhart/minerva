import { defineStore } from 'pinia'
import axios from 'axios'

import type { SpellsStore, CreateSpellRequest, UpdateSpellRequest } from '../types/store/spells'

export const useSpellsStore = defineStore('spells', {
  state: (): SpellsStore => ({
    spells: []
  }),
  actions: {
    async getSpells() {
      try {
        const response = await axios.get('/api/spells/')
        this.spells = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Error fetching spells:', error)
        console.warn('Keeping existing spells data due to fetch error')
      }
    },
    async createSpell(request: CreateSpellRequest) {
      try {
        const response = await axios.post('/api/spells/', request)
        await this.getSpells()
        return response.data
      } catch (error) {
        console.error('Error creating spell:', error)
        throw error
      }
    },
    async updateSpell(id: number, updates: UpdateSpellRequest) {
      try {
        const response = await axios.put(`/api/spells/${id}`, updates)
        await this.getSpells()
        return response.data
      } catch (error) {
        console.error('Error updating spell:', error)
        throw error
      }
    },
    async deleteSpell(id: number) {
      try {
        await axios.delete(`/api/spells/${id}`)
        await this.getSpells()
      } catch (error) {
        console.error('Error deleting spell:', error)
        throw error
      }
    },
    async updateSpellProgress(id: number, currentStars: number) {
      try {
        await this.updateSpell(id, { currentStars })
      } catch (error) {
        console.error('Error updating spell progress:', error)
        throw error
      }
    }
  }
})
