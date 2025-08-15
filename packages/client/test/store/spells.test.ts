import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useSpellsStore } from '../../src/store/spells'
import { createMockAxiosResponse, mockAxiosError } from '../setup'

const mockedAxios = vi.mocked(axios)

describe('Spells Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  describe('getSpells', () => {
    it('fetches spells and sets state', async () => {
      const mockSpells = [
        { id: 1, name: 'Fireball', description: 'A powerful fire spell', currentStars: 3 },
        { id: 2, name: 'Ice Shield', description: 'Protective ice barrier', currentStars: 1 }
      ]

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockSpells))

      const store = useSpellsStore()
      await store.getSpells()

      expect(store.spells).toEqual(mockSpells)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/spells/')
    })

    it('handles empty spells list', async () => {
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([]))

      const store = useSpellsStore()
      await store.getSpells()

      expect(store.spells).toEqual([])
    })

    it('handles non-array response gracefully', async () => {
      const nonArrayResponse = { message: 'Not an array' }
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(nonArrayResponse))

      const store = useSpellsStore()
      await store.getSpells()

      expect(store.spells).toEqual([])
    })

    it('handles API errors gracefully and keeps existing data', async () => {
      const existingSpells = [{ id: 1, name: 'Existing Spell' }]
      mockedAxios.get.mockRejectedValue(mockAxiosError('Failed to fetch spells', 500))

      const store = useSpellsStore()
      store.spells = existingSpells

      await store.getSpells()

      expect(store.spells).toEqual(existingSpells)
    })
  })

  describe('createSpell', () => {
    it('creates a new spell successfully', async () => {
      const newSpell = {
        name: 'New Spell',
        description: 'A new magical spell'
      }

      const createdSpell = { id: 3, ...newSpell, currentStars: 0 }
      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(createdSpell))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([createdSpell]))

      const store = useSpellsStore()
      const result = await store.createSpell(newSpell)

      expect(result).toEqual(createdSpell)
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/spells/', newSpell)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/spells/')
      expect(store.spells).toEqual([createdSpell])
    })

    it('handles creation errors', async () => {
      const newSpell = { name: 'Invalid Spell' }
      mockedAxios.post.mockRejectedValue(mockAxiosError('Spell creation failed', 400))

      const store = useSpellsStore()

      await expect(store.createSpell(newSpell)).rejects.toThrow('Spell creation failed')
    })
  })

  describe('updateSpell', () => {
    it('updates an existing spell successfully', async () => {
      const spellId = 1
      const updates = { name: 'Updated Spell', description: 'Updated description' }
      const updatedSpell = { id: spellId, ...updates, currentStars: 3 }

      mockedAxios.put.mockResolvedValue(createMockAxiosResponse(updatedSpell))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([updatedSpell]))

      const store = useSpellsStore()
      const result = await store.updateSpell(spellId, updates)

      expect(result).toEqual(updatedSpell)
      expect(mockedAxios.put).toHaveBeenCalledWith(`/api/spells/${spellId}`, updates)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/spells/')
    })

    it('handles update errors', async () => {
      const spellId = 999
      const updates = { name: 'Non-existent Spell' }
      mockedAxios.put.mockRejectedValue(mockAxiosError('Spell not found', 404))

      const store = useSpellsStore()

      await expect(store.updateSpell(spellId, updates)).rejects.toThrow('Spell not found')
    })
  })

  describe('deleteSpell', () => {
    it('deletes a spell successfully', async () => {
      const spellId = 1

      mockedAxios.delete.mockResolvedValue(createMockAxiosResponse(null, 204))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([]))

      const store = useSpellsStore()
      await store.deleteSpell(spellId)

      expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/spells/${spellId}`)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/spells/')
      expect(store.spells).toEqual([])
    })

    it('handles deletion errors', async () => {
      const spellId = 999
      mockedAxios.delete.mockRejectedValue(mockAxiosError('Spell not found', 404))

      const store = useSpellsStore()

      await expect(store.deleteSpell(spellId)).rejects.toThrow('Spell not found')
    })
  })

  describe('updateSpellProgress', () => {
    it('updates spell progress successfully', async () => {
      const spellId = 1
      const currentStars = 4
      const updatedSpell = { id: spellId, name: 'Test Spell', currentStars }

      mockedAxios.put.mockResolvedValue(createMockAxiosResponse(updatedSpell))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([updatedSpell]))

      const store = useSpellsStore()
      await store.updateSpellProgress(spellId, currentStars)

      expect(mockedAxios.put).toHaveBeenCalledWith(`/api/spells/${spellId}`, { currentStars })
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/spells/')
    })

    it('handles progress update errors', async () => {
      const spellId = 999
      const currentStars = 5
      mockedAxios.put.mockRejectedValue(mockAxiosError('Spell not found', 404))

      const store = useSpellsStore()

      await expect(store.updateSpellProgress(spellId, currentStars)).rejects.toThrow('Spell not found')
    })
  })

  describe('state management', () => {
    it('initializes with empty spells array', () => {
      const store = useSpellsStore()
      expect(store.spells).toEqual([])
    })

    it('updates spells state after fetching', async () => {
      const mockSpells = [{ id: 1, name: 'Test Spell' }]
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockSpells))

      const store = useSpellsStore()
      await store.getSpells()

      expect(store.spells).toEqual(mockSpells)
    })

    it('refreshes spells after creation', async () => {
      const newSpell = { name: 'New Spell' }
      const createdSpell = { id: 1, ...newSpell, currentStars: 0 }

      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(createdSpell))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([createdSpell]))

      const store = useSpellsStore()
      await store.createSpell(newSpell)

      expect(store.spells).toEqual([createdSpell])
    })

    it('refreshes spells after update', async () => {
      const spellId = 1
      const updates = { name: 'Updated Spell' }
      const updatedSpell = { id: spellId, ...updates, currentStars: 2 }

      mockedAxios.put.mockResolvedValue(createMockAxiosResponse(updatedSpell))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([updatedSpell]))

      const store = useSpellsStore()
      await store.updateSpell(spellId, updates)

      expect(store.spells).toEqual([updatedSpell])
    })

    it('refreshes spells after deletion', async () => {
      const spellId = 1

      mockedAxios.delete.mockResolvedValue(createMockAxiosResponse(null, 204))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([]))

      const store = useSpellsStore()
      await store.deleteSpell(spellId)

      expect(store.spells).toEqual([])
    })
  })

  describe('error handling', () => {
    it('logs errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.get.mockRejectedValue(new Error('Network error'))

      const store = useSpellsStore()
      await store.getSpells()

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching spells:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('logs warnings for fetch errors', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockedAxios.get.mockRejectedValue(new Error('Network error'))

      const store = useSpellsStore()
      await store.getSpells()

      expect(consoleSpy).toHaveBeenCalledWith('Keeping existing spells data due to fetch error')
      consoleSpy.mockRestore()
    })

    it('logs spell creation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.post.mockRejectedValue(new Error('Creation failed'))

      const store = useSpellsStore()

      await expect(store.createSpell({ name: 'Test' })).rejects.toThrow('Creation failed')
      expect(consoleSpy).toHaveBeenCalledWith('Error creating spell:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('logs spell update errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.put.mockRejectedValue(new Error('Update failed'))

      const store = useSpellsStore()

      await expect(store.updateSpell(1, { name: 'Test' })).rejects.toThrow('Update failed')
      expect(consoleSpy).toHaveBeenCalledWith('Error updating spell:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('logs spell deletion errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.delete.mockRejectedValue(new Error('Deletion failed'))

      const store = useSpellsStore()

      await expect(store.deleteSpell(1)).rejects.toThrow('Deletion failed')
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting spell:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('logs spell progress update errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.put.mockRejectedValue(new Error('Progress update failed'))

      const store = useSpellsStore()

      await expect(store.updateSpellProgress(1, 3)).rejects.toThrow('Progress update failed')
      expect(consoleSpy).toHaveBeenCalledWith('Error updating spell progress:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })
})
