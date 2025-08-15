import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestPerson } from '../setup.js'

const app = createTestApp()

describe('People Routes', () => {
  beforeEach(async () => {
    await testPrisma.person.deleteMany()
  })

  afterEach(async () => {
    await testPrisma.person.deleteMany()
  })

  describe('GET /api/people', () => {
    it('should return empty array when no people exist', async () => {
      const response = await request(app)
        .get('/api/people')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all people', async () => {
      await createTestPerson({ name: 'Gandalf', description: 'A wise wizard', relationship: 'Ally' })
      await createTestPerson({ name: 'Aragorn', description: 'King of Gondor', relationship: 'Friend' })

      const response = await request(app)
        .get('/api/people')
        .expect(200)

      expect(response.body).toHaveLength(2)
      // API orders by name alphabetically, so Aragorn comes first
      expect(response.body[0]).toMatchObject({
        name: 'Aragorn',
        description: 'King of Gondor',
        relationship: 'Friend'
      })
      expect(response.body[1]).toMatchObject({
        name: 'Gandalf',
        description: 'A wise wizard',
        relationship: 'Ally'
      })
    })
  })

  describe('GET /api/people/:id', () => {
    it('should return specific person by ID', async () => {
      const person = await createTestPerson({
        name: 'Legolas',
        description: 'Elven Prince',
        relationship: 'Ally'
      })

      const response = await request(app)
        .get(`/api/people/${person.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: person.id,
        name: 'Legolas',
        description: 'Elven Prince',
        relationship: 'Ally'
      })
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/people/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid person ID')
    })

    it('should return 404 for non-existent person', async () => {
      const response = await request(app)
        .get('/api/people/99999')
        .expect(404)

      expect(response.body.error).toBe('Person not found')
    })
  })

  describe('POST /api/people', () => {
    it('should create new person with all fields', async () => {
      const personData = {
        name: 'Gimli',
        description: 'Dwarf Lord',
        relationship: 'Ally',
        notableEvents: 'Skilled warrior and craftsman'
      }

      const response = await request(app)
        .post('/api/people')
        .send(personData)
        .expect(201)

      expect(response.body).toMatchObject(personData)
      expect(response.body.id).toBeTruthy()
      expect(response.body.createdAt).toBeTruthy()
    })

    it('should create person with minimal data', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: 'Frodo' })
        .expect(201)

      expect(response.body.name).toBe('Frodo')
      expect(response.body.description).toBeNull()
      expect(response.body.relationship).toBeNull()
      expect(response.body.id).toBeTruthy()
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ description: 'No name provided' })
        .expect(400)

      expect(response.body.error).toBe('Person name is required')
    })

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: '' })
        .expect(400)

      expect(response.body.error).toBe('Person name is required')
    })

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: '   ' })
        .expect(400)

      expect(response.body.error).toBe('Person name is required')
    })
  })

  describe('PUT /api/people/:id', () => {
    it('should update person successfully', async () => {
      const person = await createTestPerson({
        name: 'Original Name',
        description: 'Original description'
      })

      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        relationship: 'Enemy'
      }

      const response = await request(app)
        .put(`/api/people/${person.id}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject(updateData)
      expect(response.body.id).toBe(person.id)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/people/invalid')
        .send({ name: 'Updated' })
        .expect(400)

      expect(response.body.error).toBe('Invalid person ID')
    })

    it('should return 404 for non-existent person', async () => {
      const response = await request(app)
        .put('/api/people/99999')
        .send({ name: 'Updated' })
        .expect(404)

      expect(response.body.error).toBe('Person not found')
    })

    it('should return 400 for missing name', async () => {
      const person = await createTestPerson({ name: 'Test Person' })

      const response = await request(app)
        .put(`/api/people/${person.id}`)
        .send({ name: '' })
        .expect(400)

      expect(response.body.error).toBe('Person name is required')
    })
  })

  describe('DELETE /api/people/:id', () => {
    it('should delete person successfully', async () => {
      const person = await createTestPerson({ name: 'To Delete' })

      await request(app)
        .delete(`/api/people/${person.id}`)
        .expect(204)

      // Verify person is deleted
      const getResponse = await request(app)
        .get(`/api/people/${person.id}`)
        .expect(404)

      expect(getResponse.body.error).toBe('Person not found')
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/people/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid person ID')
    })

    it('should return 404 for non-existent person', async () => {
      const response = await request(app)
        .delete('/api/people/99999')
        .expect(404)

      expect(response.body.error).toBe('Person not found')
    })
  })

  describe('PATCH /api/people/:id/favorite', () => {
    it('should toggle favorite status', async () => {
      const person = await createTestPerson({ name: 'Test Person' })

      // Toggle to favorite
      const favoriteResponse = await request(app)
        .patch(`/api/people/${person.id}/favorite`)
        .expect(200)

      expect(favoriteResponse.body.isFavorited).toBe(true)

      // Toggle back to not favorite
      const unfavoriteResponse = await request(app)
        .patch(`/api/people/${person.id}/favorite`)
        .expect(200)

      expect(unfavoriteResponse.body.isFavorited).toBe(false)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .patch('/api/people/invalid/favorite')
        .expect(400)

      expect(response.body.error).toBe('Invalid person ID')
    })

    it('should return 404 for non-existent person', async () => {
      const response = await request(app)
        .patch('/api/people/99999/favorite')
        .expect(404)

      expect(response.body.error).toBe('Person not found')
    })
  })
})
