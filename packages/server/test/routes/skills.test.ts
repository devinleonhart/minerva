import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { createTestSkill } from '../setup.js'

const app = createTestApp()

describe('Skills Routes', () => {
  describe('GET /api/skills', () => {
    it('should return empty array when no skills exist', async () => {
      const response = await request(app)
        .get('/api/skills')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all skills', async () => {
      await createTestSkill({ name: 'Swordsmanship' })
      await createTestSkill({ name: 'Archery' })

      const response = await request(app)
        .get('/api/skills')
        .expect(200)

      expect(response.body).toHaveLength(2)
      // API orders by name alphabetically, so Archery comes first
      expect(response.body[0]).toMatchObject({
        name: 'Archery'
      })
      expect(response.body[1]).toMatchObject({
        name: 'Swordsmanship'
      })
    })
  })

  describe('GET /api/skills/:id', () => {
    it('should return specific skill by ID', async () => {
      const skill = await createTestSkill({
        name: 'Stealth'
      })

      const response = await request(app)
        .get(`/api/skills/${skill.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: skill.id,
        name: 'Stealth'
      })
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/skills/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid skill ID')
    })

    it('should return 404 for non-existent skill', async () => {
      const response = await request(app)
        .get('/api/skills/99999')
        .expect(404)

      expect(response.body.error).toBe('Skill not found')
    })
  })

  describe('POST /api/skills', () => {
    it('should create new skill', async () => {
      const skillData = {
        name: 'Lockpicking'
      }

      const response = await request(app)
        .post('/api/skills')
        .send(skillData)
        .expect(201)

      expect(response.body).toMatchObject(skillData)
      expect(response.body.id).toBeTruthy()
      expect(response.body.createdAt).toBeTruthy()
    })

    it('should create skill with minimal data', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({ name: 'Basic Skill' })
        .expect(201)

      expect(response.body.name).toBe('Basic Skill')
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({})
        .expect(400)

      expect(response.body.error).toBe('Skill name is required')
    })

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/skills')
        .send({ name: '' })
        .expect(400)

      expect(response.body.error).toBe('Skill name is required')
    })
  })

  describe('DELETE /api/skills/:id', () => {
    it('should delete skill', async () => {
      const skill = await createTestSkill({ name: 'Delete Me Skill' })

      await request(app)
        .delete(`/api/skills/${skill.id}`)
        .expect(204)

      // Verify deletion
      await request(app)
        .get(`/api/skills/${skill.id}`)
        .expect(404)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/skills/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid skill ID')
    })

    it('should return 404 for non-existent skill', async () => {
      const response = await request(app)
        .delete('/api/skills/99999')
        .expect(404)

      expect(response.body.error).toBe('Skill not found')
    })
  })
})
