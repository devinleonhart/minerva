import { defineStore } from 'pinia'
import axios from 'axios'

import type { PeopleStore, CreatePersonRequest, UpdatePersonRequest } from '../types/store/people'

export const usePeopleStore = defineStore('people', {
  state: (): PeopleStore => ({
    people: []
  }),
  getters: {
    favoritePeople: (state) => state.people.filter(person => person.isFavorited),
    searchPeople: (state) => (query: string) => {
      const lowerQuery = query.toLowerCase()
      return state.people.filter(person =>
        person.name.toLowerCase().includes(lowerQuery) ||
        (person.description && person.description.toLowerCase().includes(lowerQuery))
      )
    }
  },
  actions: {
    async getPeople() {
      try {
        const response = await axios.get('/api/people/')
        this.people = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Error fetching people:', error)
        console.warn('Keeping existing people data due to fetch error')
      }
    },
    async createPerson(request: CreatePersonRequest) {
      try {
        const response = await axios.post('/api/people/', request)
        await this.getPeople()
        return response.data
      } catch (error) {
        console.error('Error creating person:', error)
        throw error
      }
    },
    async updatePerson(id: number, updates: UpdatePersonRequest) {
      try {
        const response = await axios.put(`/api/people/${id}`, updates)
        await this.getPeople()
        return response.data
      } catch (error) {
        console.error('Error updating person:', error)
        throw error
      }
    },
    async deletePerson(id: number) {
      try {
        await axios.delete(`/api/people/${id}`)
        await this.getPeople()
      } catch (error) {
        console.error('Error deleting person:', error)
        throw error
      }
    },
    async toggleFavorite(id: number, isFavorited: boolean) {
      try {
        await this.updatePerson(id, { isFavorited })
      } catch (error) {
        console.error('Error toggling favorite:', error)
        throw error
      }
    }
  }
})
