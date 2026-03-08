import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { Person, CreatePersonRequest, UpdatePersonRequest } from '@/types/store/people'

export const usePeopleStore = defineStore('people', () => {
  const people = ref<Person[]>([])

  const getPeople = async () => {
    try {
      const response = await axios.get('/api/people/')
      people.value = Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching people:', error)
      console.warn('Keeping existing people data due to fetch error')
    }
  }

  const createPerson = async (request: CreatePersonRequest) => {
    try {
      const response = await axios.post('/api/people/', request)
      await getPeople()
      return response.data
    } catch (error) {
      console.error('Error creating person:', error)
      throw error
    }
  }

  const updatePerson = async (id: number, updates: UpdatePersonRequest) => {
    try {
      const response = await axios.put(`/api/people/${id}`, updates)
      await getPeople()
      return response.data
    } catch (error) {
      console.error('Error updating person:', error)
      throw error
    }
  }

  const deletePerson = async (id: number) => {
    try {
      await axios.delete(`/api/people/${id}`)
      await getPeople()
    } catch (error) {
      console.error('Error deleting person:', error)
      throw error
    }
  }

  const toggleFavorite = async (id: number) => {
    try {
      await axios.patch(`/api/people/${id}/favorite`)
      await getPeople()
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  }

  return {
    people,
    getPeople,
    createPerson,
    updatePerson,
    deletePerson,
    toggleFavorite
  }
})
