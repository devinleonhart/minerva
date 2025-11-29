import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestSkill } from '../setup.js'

const app = createTestApp()

describe('Skills Routes', () => {
  describe('GET /api/skills', () => {
    it('should return empty array when no skills exist', async () => {
      const response = await request(app)
        .get('/api/skills')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all skills ordered by name', async () => {
      await createTestSkill({ name: 'Zebra Skill' })
      await createTestSkill({ name: 'Apple Skill' })
      await createTestSkill({ name: 'Banana Skill' })

      const response = await request(app)
        .get('/api/skills')
        .expect(200)

      expect(response.body).toHaveLength(3)
      // Verify ordering by name (ascending)
      expect(response.body[0].name).toBe('Apple Skill')
      expect(response.body[1].name).toBe('Banana Skill')
      expect(response.body[2].name).toBe('Zebra Skill')
    })
  })

  describe('GET /api/skills/:id', () => {
    it('should return specific skill by ID', async () => {
      const skill = await createTestSkill({
        name: 'Test Skill'
      })

      const response = await request(app)
        .get(`/api/skills/${skill.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: skill.id,
        name: 'Test Skill'
      })
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
    })

    it('should return 400 for invalid ID (non-numeric)', async () => {
      const response = await request(app)
        .get('/api/skills/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid skill ID'
      })
    })

    it('should return 400 for invalid ID (negative number)', async () => {
      const response = await request(app)
        .get('/api/skills/-1')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid skill ID'
      })
    })

    it('should return 400 for invalid ID (zero)', async () => {
      const response = await request(app)
        .get('/api/skills/0')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid skill ID'
      })
    })

    it('should return 404 for non-existent skill', async () => {
      const response = await request(app)
        .get('/api/skills/99999')
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Skill not found'
      })
    })
  })

  describe('POST /api/skills', () => {
    it('should create new skill', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({
          name: 'New Skill'
        })
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'New Skill'
      })
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')

      // Verify it was actually created in the database
      const skill = await testPrisma.skill.findUnique({
        where: { id: response.body.id }
      })
      expect(skill).toBeTruthy()
      expect(skill?.name).toBe('New Skill')
    })

    it('should trim whitespace from name', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({
          name: '  Trimmed Skill  '
        })
        .expect(201)

      expect(response.body.name).toBe('Trimmed Skill')
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({})
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Skill name is required'
      })
    })

    it('should return 400 for empty name string', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({
          name: ''
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Skill name is required'
      })
    })

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({
          name: '   '
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Skill name is required'
      })
    })

    it('should return 400 for non-string name', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({
          name: 123
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Skill name is required'
      })
    })

    it('should return 409 for duplicate skill name', async () => {
      await createTestSkill({ name: 'Duplicate Skill' })

      const response = await request(app)
        .post('/api/skills')
        .send({
          name: 'Duplicate Skill'
        })
        .expect(409)

      expect(response.body).toMatchObject({
        error: 'A skill with this name already exists'
      })
    })

    it('should return 409 for duplicate skill name with different case after trimming', async () => {
      await createTestSkill({ name: 'Test Skill' })

      const response = await request(app)
        .post('/api/skills')
        .send({
          name: '  Test Skill  '
        })
        .expect(409)

      expect(response.body).toMatchObject({
        error: 'A skill with this name already exists'
      })
    })
  })

  describe('DELETE /api/skills/:id', () => {
    it('should delete skill successfully', async () => {
      const skill = await createTestSkill({
        name: 'To Delete'
      })

      await request(app)
        .delete(`/api/skills/${skill.id}`)
        .expect(204)

      // Verify it was deleted
      const deleted = await testPrisma.skill.findUnique({
        where: { id: skill.id }
      })
      expect(deleted).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/skills/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid skill ID'
      })
    })

    it('should return 404 for non-existent skill', async () => {
      const response = await request(app)
        .delete('/api/skills/99999')
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Skill not found'
      })
    })
  })
})
