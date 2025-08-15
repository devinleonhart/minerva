import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestSpell } from '../setup.js'

const app = createTestApp()

describe('Spells Routes', () => {
  beforeEach(async () => {
    await testPrisma.spell.deleteMany()
  })

  afterEach(async () => {
    await testPrisma.spell.deleteMany()
  })

  describe('GET /api/spells', () => {
    it('should return empty array when no spells exist', async () => {
      const response = await request(app)
        .get('/api/spells')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all spells', async () => {
      await createTestSpell({ name: 'Fireball', currentStars: 2, neededStars: 3 })
      await createTestSpell({ name: 'Healing Word', currentStars: 1, neededStars: 1, isLearned: true })

      const response = await request(app)
        .get('/api/spells')
        .expect(200)

      expect(response.body).toHaveLength(2)
      // API orders by isLearned desc first, so Healing Word (learned) comes first
      expect(response.body[0]).toMatchObject({
        name: 'Healing Word',
        currentStars: 1,
        neededStars: 1,
        isLearned: true
      })
      expect(response.body[1]).toMatchObject({
        name: 'Fireball',
        currentStars: 2,
        neededStars: 3,
        isLearned: false
      })
    })
  })

  describe('GET /api/spells/:id', () => {
    it('should return specific spell by ID', async () => {
      const spell = await createTestSpell({
        name: 'Lightning Bolt',
        currentStars: 3,
        neededStars: 5
      })

      const response = await request(app)
        .get(`/api/spells/${spell.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: spell.id,
        name: 'Lightning Bolt',
        currentStars: 3,
        neededStars: 5
      })
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/spells/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid spell ID')
    })

    it('should return 404 for non-existent spell', async () => {
      const response = await request(app)
        .get('/api/spells/99999')
        .expect(404)

      expect(response.body.error).toBe('Spell not found')
    })
  })

  describe('POST /api/spells', () => {
    it('should create new spell', async () => {
      const spellData = {
        name: 'Magic Missile',
        currentStars: 0,
        neededStars: 2,
        isLearned: false
      }

      const response = await request(app)
        .post('/api/spells')
        .send(spellData)
        .expect(201)

      expect(response.body).toMatchObject(spellData)
      expect(response.body.id).toBeTruthy()
      expect(response.body.createdAt).toBeTruthy()
    })

    it('should create spell with minimal data', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({ name: 'Simple Spell' })
        .expect(201)

      expect(response.body.name).toBe('Simple Spell')
      expect(response.body.currentStars).toBe(0)
      expect(response.body.neededStars).toBe(1)
      expect(response.body.isLearned).toBe(false)
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({ currentStars: 1 })
        .expect(400)

      expect(response.body.error).toBe('Spell name is required')
    })

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({ name: '' })
        .expect(400)

      expect(response.body.error).toBe('Spell name is required')
    })

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({ name: '   ' })
        .expect(400)

      expect(response.body.error).toBe('Spell name is required')
    })

    it('should handle duplicate spell names', async () => {
      await createTestSpell({ name: 'Lightning Bolt' })

      const response = await request(app)
        .post('/api/spells')
        .send({ name: 'Lightning Bolt' })
        .expect(409)

      expect(response.body.error).toBe('A spell with this name already exists')
    })

    it('should validate neededStars with invalid inputs', async () => {
      const invalidInputs = [
        { neededStars: 0, expectedError: 'Needed stars must be a positive integer' },
        { neededStars: -1, expectedError: 'Needed stars must be a positive integer' },
        { neededStars: 1.5, expectedError: 'Needed stars must be a positive integer' }
      ]

      for (const input of invalidInputs) {
        const response = await request(app)
          .post('/api/spells')
          .send({ name: 'Test Spell', ...input })
          .expect(400)

        expect(response.body.error).toBe(input.expectedError)
      }
    })

    it('should validate currentStars with invalid inputs', async () => {
      const invalidInputs = [
        { currentStars: -1, expectedError: 'Current stars must be a non-negative integer' },
        { currentStars: 1.5, expectedError: 'Current stars must be a non-negative integer' }
      ]

      for (const input of invalidInputs) {
        const response = await request(app)
          .post('/api/spells')
          .send({ name: 'Test Spell', ...input })
          .expect(400)

        expect(response.body.error).toBe(input.expectedError)
      }
    })

    it('should reject currentStars greater than neededStars', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'Overpowered Spell',
          currentStars: 5,
          neededStars: 3
        })
        .expect(400)

      expect(response.body.error).toBe('Current stars cannot exceed needed stars')
    })

    it('should automatically set isLearned when currentStars equals neededStars', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'Mastered Spell',
          currentStars: 3,
          neededStars: 3
        })
        .expect(201)

      expect(response.body.isLearned).toBe(true)
    })
  })

  describe('PUT /api/spells/:id', () => {
    it('should update spell successfully', async () => {
      const spell = await createTestSpell({
        name: 'Original Spell',
        currentStars: 1,
        neededStars: 3
      })

      const updateData = {
        name: 'Updated Spell',
        currentStars: 2,
        neededStars: 4
      }

      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject(updateData)
      expect(response.body.id).toBe(spell.id)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/spells/invalid')
        .send({ name: 'Updated' })
        .expect(400)

      expect(response.body.error).toBe('Invalid spell ID')
    })

    it('should return 404 for non-existent spell', async () => {
      const response = await request(app)
        .put('/api/spells/99999')
        .send({ name: 'Updated' })
        .expect(404)

      expect(response.body.error).toBe('Spell not found')
    })

    it('should return 400 for invalid currentStars', async () => {
      const spell = await createTestSpell({ name: 'Test Spell' })

      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({ currentStars: -1 })
        .expect(400)

      expect(response.body.error).toBe('Current stars must be a non-negative integer')
    })

    it('should return 400 for invalid neededStars', async () => {
      const spell = await createTestSpell({ name: 'Test Spell' })

      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({ neededStars: 0 })
        .expect(400)

      expect(response.body.error).toBe('Needed stars must be a positive integer')
    })

    it('should return 400 when currentStars exceed neededStars', async () => {
      const spell = await createTestSpell({ name: 'Test Spell', neededStars: 3 })

      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({ currentStars: 5 })
        .expect(400)

      expect(response.body.error).toBe('Current stars cannot exceed needed stars')
    })
  })

  describe('DELETE /api/spells/:id', () => {
    it('should delete spell successfully', async () => {
      const spell = await createTestSpell({ name: 'To Delete' })

      await request(app)
        .delete(`/api/spells/${spell.id}`)
        .expect(204)

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/spells/${spell.id}`)
        .expect(404)

      expect(getResponse.body.error).toBe('Spell not found')
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/spells/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid spell ID')
    })

    it('should return 404 for non-existent spell', async () => {
      const response = await request(app)
        .delete('/api/spells/99999')
        .expect(404)

      expect(response.body.error).toBe('Spell not found')
    })
  })

  describe('PATCH /api/spells/:id/progress', () => {
    it('should update spell progress successfully', async () => {
      const spell = await createTestSpell({
        name: 'Progress Test',
        currentStars: 1,
        neededStars: 3
      })

      const response = await request(app)
        .patch(`/api/spells/${spell.id}/progress`)
        .send({ currentStars: 2 })
        .expect(200)

      expect(response.body.currentStars).toBe(2)
      expect(response.body.isLearned).toBe(false)
    })

    it('should automatically set isLearned when progress reaches neededStars', async () => {
      const spell = await createTestSpell({
        name: 'Mastery Test',
        currentStars: 2,
        neededStars: 3
      })

      const response = await request(app)
        .patch(`/api/spells/${spell.id}/progress`)
        .send({ currentStars: 3 })
        .expect(200)

      expect(response.body.currentStars).toBe(3)
      expect(response.body.isLearned).toBe(true)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .patch('/api/spells/invalid/progress')
        .send({ currentStars: 2 })
        .expect(400)

      expect(response.body.error).toBe('Invalid spell ID')
    })

    it('should return 404 for non-existent spell', async () => {
      const response = await request(app)
        .patch('/api/spells/99999/progress')
        .send({ currentStars: 2 })
        .expect(404)

      expect(response.body.error).toBe('Spell not found')
    })

    it('should return 400 for invalid currentStars', async () => {
      const spell = await createTestSpell({ name: 'Test Spell' })

      const response = await request(app)
        .patch(`/api/spells/${spell.id}/progress`)
        .send({ currentStars: -1 })
        .expect(400)

      expect(response.body.error).toBe('Current stars must be a non-negative integer')
    })

    it('should return 400 when currentStars exceed neededStars', async () => {
      const spell = await createTestSpell({ name: 'Test Spell', neededStars: 3 })

      const response = await request(app)
        .patch(`/api/spells/${spell.id}/progress`)
        .send({ currentStars: 5 })
        .expect(400)

      expect(response.body.error).toBe('Current stars cannot exceed needed stars')
    })
  })
})
