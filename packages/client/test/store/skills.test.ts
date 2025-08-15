import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useSkillsStore } from '../../src/store/skills'
import { createMockAxiosResponse, mockAxiosError } from '../setup'

const mockedAxios = vi.mocked(axios)

describe('Skills Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  describe('getSkills', () => {
    it('fetches skills and sets state', async () => {
      const mockSkills = [
        { id: 1, name: 'Alchemy', description: 'Potion making skill' },
        { id: 2, name: 'Enchanting', description: 'Magical enhancement skill' }
      ]

      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockSkills))

      const store = useSkillsStore()
      await store.getSkills()

      expect(store.skills).toEqual(mockSkills)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/skills/')
    })

    it('handles empty skills list', async () => {
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([]))

      const store = useSkillsStore()
      await store.getSkills()

      expect(store.skills).toEqual([])
    })

    it('handles non-array response gracefully', async () => {
      const nonArrayResponse = { message: 'Not an array' }
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(nonArrayResponse))

      const store = useSkillsStore()
      await store.getSkills()

      expect(store.skills).toEqual([])
    })

    it('handles API errors gracefully and keeps existing data', async () => {
      const existingSkills = [{ id: 1, name: 'Existing Skill' }]
      mockedAxios.get.mockRejectedValue(mockAxiosError('Failed to fetch skills', 500))

      const store = useSkillsStore()
      store.skills = existingSkills

      await store.getSkills()

      expect(store.skills).toEqual(existingSkills)
    })
  })

  describe('createSkill', () => {
    it('creates a new skill successfully', async () => {
      const newSkill = {
        name: 'New Skill',
        description: 'A new magical skill'
      }

      const createdSkill = { id: 3, ...newSkill }
      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(createdSkill))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([createdSkill]))

      const store = useSkillsStore()
      const result = await store.createSkill(newSkill)

      expect(result).toEqual(createdSkill)
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/skills/', newSkill)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/skills/')
      expect(store.skills).toEqual([createdSkill])
    })

    it('handles creation errors', async () => {
      const newSkill = { name: 'Invalid Skill' }
      mockedAxios.post.mockRejectedValue(mockAxiosError('Skill creation failed', 400))

      const store = useSkillsStore()

      await expect(store.createSkill(newSkill)).rejects.toThrow('Skill creation failed')
    })
  })

  describe('deleteSkill', () => {
    it('deletes a skill successfully', async () => {
      const skillId = 1

      mockedAxios.delete.mockResolvedValue(createMockAxiosResponse(null, 204))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([]))

      const store = useSkillsStore()
      await store.deleteSkill(skillId)

      expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/skills/${skillId}`)
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/skills/')
      expect(store.skills).toEqual([])
    })

    it('handles deletion errors', async () => {
      const skillId = 999
      mockedAxios.delete.mockRejectedValue(mockAxiosError('Skill not found', 404))

      const store = useSkillsStore()

      await expect(store.deleteSkill(skillId)).rejects.toThrow('Skill not found')
    })
  })

  describe('state management', () => {
    it('initializes with empty skills array', () => {
      const store = useSkillsStore()
      expect(store.skills).toEqual([])
    })

    it('updates skills state after fetching', async () => {
      const mockSkills = [{ id: 1, name: 'Test Skill' }]
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse(mockSkills))

      const store = useSkillsStore()
      await store.getSkills()

      expect(store.skills).toEqual(mockSkills)
    })

    it('refreshes skills after creation', async () => {
      const newSkill = { name: 'New Skill' }
      const createdSkill = { id: 1, ...newSkill }

      mockedAxios.post.mockResolvedValue(createMockAxiosResponse(createdSkill))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([createdSkill]))

      const store = useSkillsStore()
      await store.createSkill(newSkill)

      expect(store.skills).toEqual([createdSkill])
    })

    it('refreshes skills after deletion', async () => {
      const skillId = 1

      mockedAxios.delete.mockResolvedValue(createMockAxiosResponse(null, 204))
      mockedAxios.get.mockResolvedValue(createMockAxiosResponse([]))

      const store = useSkillsStore()
      await store.deleteSkill(skillId)

      expect(store.skills).toEqual([])
    })
  })

  describe('error handling', () => {
    it('logs errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.get.mockRejectedValue(new Error('Network error'))

      const store = useSkillsStore()
      await store.getSkills()

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching skills:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('logs warnings for fetch errors', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      mockedAxios.get.mockRejectedValue(new Error('Network error'))

      const store = useSkillsStore()
      await store.getSkills()

      expect(consoleSpy).toHaveBeenCalledWith('Keeping existing skills data due to fetch error')
      consoleSpy.mockRestore()
    })

    it('logs skill creation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.post.mockRejectedValue(new Error('Creation failed'))

      const store = useSkillsStore()

      await expect(store.createSkill({ name: 'Test' })).rejects.toThrow('Creation failed')
      expect(consoleSpy).toHaveBeenCalledWith('Error creating skill:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('logs skill deletion errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockedAxios.delete.mockRejectedValue(new Error('Deletion failed'))

      const store = useSkillsStore()

      await expect(store.deleteSkill(1)).rejects.toThrow('Deletion failed')
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting skill:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })
})
