import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestSpell } from '../setup.js'

const app = createTestApp()

describe('Spells Routes', () => {
  describe('GET /api/spells', () => {
    it('should return empty array when no spells exist', async () => {
      const response = await request(app)
        .get('/api/spells')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all spells ordered by learned status then name', async () => {
      await createTestSpell({
        name: 'Zebra Spell',
        isLearned: false
      })
      await createTestSpell({
        name: 'Apple Spell',
        isLearned: true
      })
      await createTestSpell({
        name: 'Banana Spell',
        isLearned: false
      })
      await createTestSpell({
        name: 'Charlie Spell',
        isLearned: true
      })

      const response = await request(app)
        .get('/api/spells')
        .expect(200)

      expect(response.body).toHaveLength(4)
      // Learned first, then alphabetical
      expect(response.body[0].name).toBe('Apple Spell')
      expect(response.body[0].isLearned).toBe(true)
      expect(response.body[1].name).toBe('Charlie Spell')
      expect(response.body[1].isLearned).toBe(true)
      expect(response.body[2].name).toBe('Banana Spell')
      expect(response.body[2].isLearned).toBe(false)
      expect(response.body[3].name).toBe('Zebra Spell')
      expect(response.body[3].isLearned).toBe(false)
    })
  })

  describe('GET /api/spells/:id', () => {
    it('should return specific spell by ID', async () => {
      const spell = await createTestSpell({
        name: 'Test Spell',
        currentStars: 3,
        neededStars: 5,
        isLearned: false
      })

      const response = await request(app)
        .get(`/api/spells/${spell.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: spell.id,
        name: 'Test Spell',
        currentStars: 3,
        neededStars: 5,
        isLearned: false
      })
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
    })

    it('should return 400 for invalid ID (non-numeric)', async () => {
      const response = await request(app)
        .get('/api/spells/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid spell ID'
      })
    })

    it('should return 400 for invalid ID (negative number)', async () => {
      const response = await request(app)
        .get('/api/spells/-1')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid spell ID'
      })
    })

    it('should return 400 for invalid ID (zero)', async () => {
      const response = await request(app)
        .get('/api/spells/0')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid spell ID'
      })
    })

    it('should return 404 for non-existent spell', async () => {
      const response = await request(app)
        .get('/api/spells/99999')
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Spell not found'
      })
    })
  })

  describe('POST /api/spells', () => {
    it('should create new spell with all fields', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'New Spell',
          neededStars: 5,
          currentStars: 2
        })
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'New Spell',
        neededStars: 5,
        currentStars: 2,
        isLearned: false // 2 < 5
      })
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')

      // Verify it was actually created in the database
      const spell = await testPrisma.spell.findUnique({
        where: { id: response.body.id }
      })
      expect(spell).toBeTruthy()
      expect(spell?.name).toBe('New Spell')
    })

    it('should create spell with default values', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'Default Spell'
        })
        .expect(201)

      expect(response.body.neededStars).toBe(1)
      expect(response.body.currentStars).toBe(0)
      expect(response.body.isLearned).toBe(false)
    })

    it('should set isLearned to true when currentStars >= neededStars', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'Learned Spell',
          neededStars: 3,
          currentStars: 3
        })
        .expect(201)

      expect(response.body.isLearned).toBe(true)
    })

    it('should return 400 when currentStars > neededStars on create', async () => {
      // The route correctly prevents currentStars from exceeding neededStars
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'Overlearned Spell',
          neededStars: 3,
          currentStars: 5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars cannot exceed needed stars'
      })
    })

    it('should trim whitespace from name', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: '  Trimmed Spell  '
        })
        .expect(201)

      expect(response.body.name).toBe('Trimmed Spell')
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          neededStars: 5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Spell name is required'
      })
    })

    it('should return 400 for empty name string', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: ''
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Spell name is required'
      })
    })

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: '   '
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Spell name is required'
      })
    })

    it('should return 400 for name longer than 255 characters', async () => {
      const longName = 'a'.repeat(256)

      const response = await request(app)
        .post('/api/spells')
        .send({
          name: longName
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Spell name must be 255 characters or less'
      })
    })

    it('should return 400 for non-string name', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 123
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Spell name is required'
      })
    })

    it('should return 400 for non-integer neededStars', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'Test Spell',
          neededStars: 5.5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Needed stars must be a positive integer'
      })
    })

    it('should return 400 for neededStars less than 1', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'Test Spell',
          neededStars: 0
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Needed stars must be a positive integer'
      })
    })

    it('should return 400 for negative neededStars', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'Test Spell',
          neededStars: -1
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Needed stars must be a positive integer'
      })
    })

    it('should return 400 for non-integer currentStars', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'Test Spell',
          currentStars: 2.5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars must be a non-negative integer'
      })
    })

    it('should return 400 for negative currentStars', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'Test Spell',
          currentStars: -1
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars must be a non-negative integer'
      })
    })

    it('should return 400 when currentStars exceeds neededStars', async () => {
      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'Test Spell',
          neededStars: 3,
          currentStars: 5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars cannot exceed needed stars'
      })
    })

    it('should return 409 for duplicate spell name', async () => {
      await createTestSpell({ name: 'Duplicate Spell' })

      const response = await request(app)
        .post('/api/spells')
        .send({
          name: 'Duplicate Spell'
        })
        .expect(409)

      expect(response.body).toMatchObject({
        error: 'A spell with this name already exists'
      })
    })
  })

  describe('PUT /api/spells/:id', () => {
    let spell: Awaited<ReturnType<typeof createTestSpell>>

    beforeEach(async () => {
      spell = await createTestSpell({
        name: 'Original Spell',
        currentStars: 2,
        neededStars: 5,
        isLearned: false
      })
    })

    it('should update all fields', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          name: 'Updated Spell',
          neededStars: 10,
          currentStars: 8
        })
        .expect(200)

      expect(response.body).toMatchObject({
        id: spell.id,
        name: 'Updated Spell',
        neededStars: 10,
        currentStars: 8,
        isLearned: false // 8 < 10
      })

      // Verify in database
      const updated = await testPrisma.spell.findUnique({
        where: { id: spell.id }
      })
      expect(updated?.name).toBe('Updated Spell')
      expect(updated?.isLearned).toBe(false)
    })

    it('should update only name', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          name: 'New Name Only'
        })
        .expect(200)

      expect(response.body.name).toBe('New Name Only')
      expect(response.body.neededStars).toBe(5) // Unchanged
      expect(response.body.currentStars).toBe(2) // Unchanged
    })

    it('should update only neededStars', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          neededStars: 10
        })
        .expect(200)

      expect(response.body.neededStars).toBe(10)
      expect(response.body.name).toBe('Original Spell') // Unchanged
      expect(response.body.isLearned).toBe(false) // 2 < 10
    })

    it('should update only currentStars', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          currentStars: 4
        })
        .expect(200)

      expect(response.body.currentStars).toBe(4)
      expect(response.body.name).toBe('Original Spell') // Unchanged
      expect(response.body.isLearned).toBe(false) // 4 < 5
    })

    it('should update isLearned when currentStars >= neededStars', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          currentStars: 5
        })
        .expect(200)

      expect(response.body.currentStars).toBe(5)
      expect(response.body.isLearned).toBe(true) // 5 >= 5
    })

    it('should trim whitespace from name when updating', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          name: '  Trimmed Name  '
        })
        .expect(200)

      expect(response.body.name).toBe('Trimmed Name')
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/spells/abc')
        .send({
          name: 'Test'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid spell ID'
      })
    })

    it('should return 400 for empty name string', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          name: ''
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Spell name must be a non-empty string'
      })
    })

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          name: '   '
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Spell name must be a non-empty string'
      })
    })

    it('should return 400 for name longer than 255 characters', async () => {
      const longName = 'a'.repeat(256)

      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          name: longName
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Spell name must be 255 characters or less'
      })
    })

    it('should return 400 for non-integer neededStars', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          neededStars: 5.5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Needed stars must be a positive integer'
      })
    })

    it('should return 400 for neededStars less than 1', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          neededStars: 0
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Needed stars must be a positive integer'
      })
    })

    it('should return 400 for non-integer currentStars', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          currentStars: 2.5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars must be a non-negative integer'
      })
    })

    it('should return 400 for negative currentStars', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          currentStars: -1
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars must be a non-negative integer'
      })
    })

    it('should return 400 when currentStars would exceed neededStars', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          currentStars: 10 // Exceeds neededStars of 5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars cannot exceed needed stars'
      })
    })

    it('should return 400 when updating neededStars would make currentStars exceed it', async () => {
      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          neededStars: 1 // CurrentStars is 2, which exceeds 1
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars cannot exceed needed stars'
      })
    })

    it('should return 404 for non-existent spell', async () => {
      const response = await request(app)
        .put('/api/spells/99999')
        .send({
          name: 'Test'
        })
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Spell not found'
      })
    })

    it('should return 409 for duplicate spell name', async () => {
      await createTestSpell({ name: 'Other Spell' })

      const response = await request(app)
        .put(`/api/spells/${spell.id}`)
        .send({
          name: 'Other Spell'
        })
        .expect(409)

      expect(response.body).toMatchObject({
        error: 'A spell with this name already exists'
      })
    })
  })

  describe('DELETE /api/spells/:id', () => {
    it('should delete spell successfully', async () => {
      const spell = await createTestSpell({
        name: 'To Delete'
      })

      await request(app)
        .delete(`/api/spells/${spell.id}`)
        .expect(204)

      // Verify it was deleted
      const deleted = await testPrisma.spell.findUnique({
        where: { id: spell.id }
      })
      expect(deleted).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/spells/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid spell ID'
      })
    })

    it('should return 404 for non-existent spell', async () => {
      const response = await request(app)
        .delete('/api/spells/99999')
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Spell not found'
      })
    })
  })

  describe('PATCH /api/spells/:id/progress', () => {
    it('should update spell progress successfully', async () => {
      const spell = await createTestSpell({
        name: 'Progress Spell',
        currentStars: 2,
        neededStars: 5,
        isLearned: false
      })

      const response = await request(app)
        .patch(`/api/spells/${spell.id}/progress`)
        .send({
          currentStars: 4
        })
        .expect(200)

      expect(response.body).toMatchObject({
        id: spell.id,
        currentStars: 4,
        isLearned: false // 4 < 5
      })

      // Verify in database
      const updated = await testPrisma.spell.findUnique({
        where: { id: spell.id }
      })
      expect(updated?.currentStars).toBe(4)
      expect(updated?.isLearned).toBe(false)
    })

    it('should set isLearned to true when currentStars reaches neededStars', async () => {
      const spell = await createTestSpell({
        name: 'Learning Spell',
        currentStars: 4,
        neededStars: 5,
        isLearned: false
      })

      const response = await request(app)
        .patch(`/api/spells/${spell.id}/progress`)
        .send({
          currentStars: 5
        })
        .expect(200)

      expect(response.body.currentStars).toBe(5)
      expect(response.body.isLearned).toBe(true) // 5 >= 5

      // Verify in database
      const updated = await testPrisma.spell.findUnique({
        where: { id: spell.id }
      })
      expect(updated?.isLearned).toBe(true)
    })

    it('should return 400 when currentStars exceeds neededStars in progress update', async () => {
      // The route correctly prevents currentStars from exceeding neededStars
      const spell = await createTestSpell({
        name: 'Overlearning Spell',
        currentStars: 3,
        neededStars: 5,
        isLearned: false
      })

      const response = await request(app)
        .patch(`/api/spells/${spell.id}/progress`)
        .send({
          currentStars: 7
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars cannot exceed needed stars'
      })
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .patch('/api/spells/abc/progress')
        .send({
          currentStars: 5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid spell ID'
      })
    })

    it('should return 400 for missing currentStars', async () => {
      const spell = await createTestSpell({ name: 'Test Spell' })

      const response = await request(app)
        .patch(`/api/spells/${spell.id}/progress`)
        .send({})
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars is required and must be a number'
      })
    })

    it('should return 400 for non-number currentStars', async () => {
      const spell = await createTestSpell({ name: 'Test Spell' })

      const response = await request(app)
        .patch(`/api/spells/${spell.id}/progress`)
        .send({
          currentStars: 'five'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars is required and must be a number'
      })
    })

    it('should return 400 for negative currentStars', async () => {
      const spell = await createTestSpell({ name: 'Test Spell' })

      const response = await request(app)
        .patch(`/api/spells/${spell.id}/progress`)
        .send({
          currentStars: -1
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars must be a non-negative integer'
      })
    })

    it('should return 400 for non-integer currentStars', async () => {
      const spell = await createTestSpell({
        name: 'Test Spell',
        neededStars: 10 // High enough to not trigger the "exceeds neededStars" error
      })

      const response = await request(app)
        .patch(`/api/spells/${spell.id}/progress`)
        .send({
          currentStars: 2.5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars must be a non-negative integer'
      })
    })

    it('should return 400 when currentStars exceeds neededStars', async () => {
      const spell = await createTestSpell({
        name: 'Test Spell',
        currentStars: 3,
        neededStars: 5
      })

      const response = await request(app)
        .patch(`/api/spells/${spell.id}/progress`)
        .send({
          currentStars: 6
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Current stars cannot exceed needed stars'
      })
    })

    it('should return 404 for non-existent spell', async () => {
      const response = await request(app)
        .patch('/api/spells/99999/progress')
        .send({
          currentStars: 5
        })
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Spell not found'
      })
    })
  })
})
