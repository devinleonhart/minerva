import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { usePeopleStore } from '../../src/store/people'
import { createMockAxiosResponse, mockAxiosError } from '../setup'

const mockedAxios = vi.mocked(axios)

describe('People Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  describe('getPeople', () => {
    it('fetches people and sets state correctly', async () => {
      const mockPeople = [
        { id: 1, name: 'John Doe', description: 'A friendly person', isFavorited: false },
        { id: 2, name: 'Jane Smith', description: 'A helpful person', isFavorited: true }
      ]

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockPeople))

      const store = usePeopleStore()
      await store.getPeople()

      expect(store.people).toEqual(mockPeople)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/people/')
    })

    it('handles API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(mockAxiosError('Network error'))

      const store = usePeopleStore()

      // The store catches errors and doesn't throw, so we test the behavior
      await store.getPeople()
      expect(store.people).toEqual([])
    })
  })

  describe('createPerson', () => {
    it('creates a new person via POST', async () => {
      const newPerson = { name: 'New Person', description: 'A new person' }
      const createdPerson = { id: 3, ...newPerson, isFavorited: false }

      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(createdPerson, 201))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([createdPerson]))

      const store = usePeopleStore()
      await store.createPerson(newPerson)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/people/', newPerson)
    })

    it('handles validation errors', async () => {
      const invalidPerson = { name: '', description: 'No name' }

      mockedAxios.post.mockRejectedValue(mockAxiosError('Person name is required', 400))

      const store = usePeopleStore()

      await expect(store.createPerson(invalidPerson)).rejects.toThrow('Person name is required')
    })
  })

  describe('updatePerson', () => {
    it('updates an existing person via PUT', async () => {
      const personId = 1
      const updateData = { name: 'Updated Name', isFavorited: true }
      const updatedPerson = { id: personId, ...updateData, description: 'Original description' }

      mockedAxios.put.mockResolvedValue(createMockAxiosResponse(updatedPerson))

      const store = usePeopleStore()
      await store.updatePerson(personId, updateData)

      expect(mockedAxios.put).toHaveBeenCalledWith(`/api/people/${personId}`, updateData)
    })

    it('handles update of non-existent person', async () => {
      const personId = 999
      const updateData = { name: 'Updated Name' }

      mockedAxios.put.mockRejectedValue(mockAxiosError('Person not found', 404))

      const store = usePeopleStore()

      await expect(store.updatePerson(personId, updateData)).rejects.toThrow('Person not found')
    })
  })

  describe('deletePerson', () => {
    it('deletes a person via DELETE', async () => {
      const personId = 1

      mockedAxios.delete.mockResolvedValue(createMockAxiosResponse(null, 204))

      const store = usePeopleStore()
      await store.deletePerson(personId)

      expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/people/${personId}`)
    })

    it('handles deletion of non-existent person', async () => {
      const personId = 999

      mockedAxios.delete.mockRejectedValue(mockAxiosError('Person not found', 404))

      const store = usePeopleStore()

      await expect(store.deletePerson(personId)).rejects.toThrow('Person not found')
    })
  })

  describe('getters', () => {
    it('filters people by favorites correctly', async () => {
      const mockPeople = [
        { id: 1, name: 'John', isFavorited: false },
        { id: 2, name: 'Jane', isFavorited: true },
        { id: 3, name: 'Bob', isFavorited: true }
      ]

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockPeople))

      const store = usePeopleStore()
      await store.getPeople()

      expect(store.favoritePeople).toHaveLength(2)
      expect(store.favoritePeople.every(person => person.isFavorited)).toBe(true)
    })

    it('searches people by name', async () => {
      const mockPeople = [
        { id: 1, name: 'John Doe', description: 'Developer' },
        { id: 2, name: 'Jane Smith', description: 'Designer' },
        { id: 3, name: 'Bob Johnson', description: 'Manager' }
      ]

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockPeople))

      const store = usePeopleStore()
      await store.getPeople()

      const searchResults = store.searchPeople('john')
      expect(searchResults).toHaveLength(2) // John Doe and Bob Johnson
      expect(searchResults.every(person =>
        person.name.toLowerCase().includes('john')
      )).toBe(true)
    })
  })
})
