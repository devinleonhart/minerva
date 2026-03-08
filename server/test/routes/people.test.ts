import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testDb, createTestPerson } from '../setup.js'
import { eq } from 'drizzle-orm'
import * as tables from '../../db/index.js'

const app = createTestApp()

describe('People Routes', () => {
  describe('GET /api/people', () => {
    it('should return empty array when no people exist', async () => {
      const response = await request(app)
        .get('/api/people')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all people ordered by favorite status then name', async () => {
      await createTestPerson({ name: 'Zebra Person',   isFavorited: false })
      await createTestPerson({ name: 'Apple Person',   isFavorited: true })
      await createTestPerson({ name: 'Banana Person',  isFavorited: false })
      await createTestPerson({ name: 'Charlie Person', isFavorited: true })

      const response = await request(app)
        .get('/api/people')
        .expect(200)

      expect(response.body).toHaveLength(4)
      expect(response.body[0].name).toBe('Apple Person')
      expect(response.body[0].isFavorited).toBe(true)
      expect(response.body[1].name).toBe('Charlie Person')
      expect(response.body[1].isFavorited).toBe(true)
      expect(response.body[2].name).toBe('Banana Person')
      expect(response.body[2].isFavorited).toBe(false)
      expect(response.body[3].name).toBe('Zebra Person')
      expect(response.body[3].isFavorited).toBe(false)
    })

    it('should include notableEvents array for each person', async () => {
      await createTestPerson({
        name: 'Event Person',
        notableEvents: ['First event', 'Second event']
      })

      const response = await request(app)
        .get('/api/people')
        .expect(200)

      expect(response.body[0].notableEvents).toHaveLength(2)
      expect(response.body[0].notableEvents[0].description).toBe('First event')
      expect(response.body[0].notableEvents[1].description).toBe('Second event')
    })
  })

  describe('GET /api/people/:id', () => {
    it('should return specific person by ID with notableEvents', async () => {
      const person = await createTestPerson({
        name: 'Test Person',
        description: 'Test Description',
        relationship: 'Friend',
        notableEvents: ['Met at conference', 'Collaborated on project'],
        url: 'https://example.com',
        isFavorited: true
      })

      const response = await request(app)
        .get(`/api/people/${person!.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: person!.id,
        name: 'Test Person',
        description: 'Test Description',
        relationship: 'Friend',
        url: 'https://example.com',
        isFavorited: true
      })
      expect(response.body.notableEvents).toHaveLength(2)
      expect(response.body.notableEvents[0].description).toBe('Met at conference')
      expect(response.body.notableEvents[1].description).toBe('Collaborated on project')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
    })

    it('should return person with empty notableEvents array when none exist', async () => {
      const person = await createTestPerson({ name: 'No Events Person' })

      const response = await request(app)
        .get(`/api/people/${person!.id}`)
        .expect(200)

      expect(response.body.notableEvents).toEqual([])
    })

    it('should return 400 for invalid ID (non-numeric)', async () => {
      const response = await request(app)
        .get('/api/people/abc')
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Invalid person ID' })
    })

    it('should return 400 for invalid ID (negative number)', async () => {
      const response = await request(app)
        .get('/api/people/-1')
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Invalid person ID' })
    })

    it('should return 400 for invalid ID (zero)', async () => {
      const response = await request(app)
        .get('/api/people/0')
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Invalid person ID' })
    })

    it('should return 404 for non-existent person', async () => {
      const response = await request(app)
        .get('/api/people/99999')
        .expect(404)

      expect(response.body).toMatchObject({ error: 'Person not found' })
    })
  })

  describe('POST /api/people', () => {
    it('should create new person with all fields', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({
          name: 'New Person',
          description: 'New Description',
          relationship: 'Colleague',
          notableEvents: ['Worked together on a project'],
          url: 'https://example.com/person'
        })
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'New Person',
        description: 'New Description',
        relationship: 'Colleague',
        url: 'https://example.com/person',
        isFavorited: false
      })
      expect(response.body.notableEvents).toHaveLength(1)
      expect(response.body.notableEvents[0].description).toBe('Worked together on a project')
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')

      const [personRow] = await testDb.select().from(tables.person).where(eq(tables.person.id, response.body.id))
      const person = personRow ?? null
      expect(person).toBeTruthy()
      expect(person?.name).toBe('New Person')
    })

    it('should create person with multiple notable events', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({
          name: 'Multi Event Person',
          notableEvents: ['Event one', 'Event two', 'Event three']
        })
        .expect(201)

      expect(response.body.notableEvents).toHaveLength(3)
    })

    it('should create person with minimal required fields', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: 'Minimal Person' })
        .expect(201)

      expect(response.body.name).toBe('Minimal Person')
      expect(response.body.description).toBeNull()
      expect(response.body.relationship).toBeNull()
      expect(response.body.notableEvents).toEqual([])
      expect(response.body.url).toBeNull()
      expect(response.body.isFavorited).toBe(false)
    })

    it('should create person with default isFavorited value (false)', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: 'Unfavorited Person' })
        .expect(201)

      expect(response.body.isFavorited).toBe(false)
    })

    it('should trim whitespace from name and optional fields', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({
          name: '  Trimmed Person  ',
          description: '  Trimmed Description  ',
          relationship: '  Friend  ',
          notableEvents: ['  Event  '],
          url: '  https://example.com  '
        })
        .expect(201)

      expect(response.body.name).toBe('Trimmed Person')
      expect(response.body.description).toBe('Trimmed Description')
      expect(response.body.relationship).toBe('Friend')
      expect(response.body.notableEvents[0].description).toBe('Event')
      expect(response.body.url).toBe('https://example.com')
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ description: 'Description' })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Person name is required' })
    })

    it('should return 400 for empty name string', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: '' })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Person name is required' })
    })

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: '   ' })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Person name is required' })
    })

    it('should return 400 for non-string name', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: 123 })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Person name is required' })
    })

    it('should return 400 for non-string description', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: 'Test Person', description: 123 })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Description must be a string or null' })
    })

    it('should return 400 for non-string relationship', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: 'Test Person', relationship: 123 })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Relationship must be a string or null' })
    })

    it('should return 400 for non-array notableEvents', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: 'Test Person', notableEvents: 'not an array' })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Notable events must be an array' })
    })

    it('should return 400 for notableEvents with empty string entries', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: 'Test Person', notableEvents: ['Valid event', ''] })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Each notable event must be a non-empty string' })
    })

    it('should return 400 for non-string url', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: 'Test Person', url: 123 })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'URL must be a string or null' })
    })

    it('should return 400 for non-boolean isFavorited', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({ name: 'Test Person', isFavorited: 'true' })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'isFavorited must be a boolean' })
    })

    it('should accept null values for optional fields', async () => {
      const response = await request(app)
        .post('/api/people')
        .send({
          name: 'Test Person',
          description: null,
          relationship: null,
          url: null
        })
        .expect(201)

      expect(response.body.description).toBeNull()
      expect(response.body.relationship).toBeNull()
      expect(response.body.notableEvents).toEqual([])
      expect(response.body.url).toBeNull()
    })
  })

  describe('PUT /api/people/:id', () => {
    let person: Awaited<ReturnType<typeof createTestPerson>>

    beforeEach(async () => {
      person = await createTestPerson({
        name: 'Original Name',
        description: 'Original Description',
        relationship: 'Original Relationship',
        notableEvents: ['Original event one', 'Original event two'],
        url: 'https://original.com',
        isFavorited: false
      })
    })

    it('should update all fields', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({
          name: 'Updated Name',
          description: 'Updated Description',
          relationship: 'Updated Relationship',
          notableEvents: ['Updated event'],
          url: 'https://updated.com',
          isFavorited: true
        })
        .expect(200)

      expect(response.body).toMatchObject({
        id: person!.id,
        name: 'Updated Name',
        description: 'Updated Description',
        relationship: 'Updated Relationship',
        url: 'https://updated.com',
        isFavorited: true
      })
      expect(response.body.notableEvents).toHaveLength(1)
      expect(response.body.notableEvents[0].description).toBe('Updated event')

      const [updatedRow] = await testDb.select().from(tables.person).where(eq(tables.person.id, person!.id))
      const updated = updatedRow ?? null
      expect(updated?.name).toBe('Updated Name')
      expect(updated?.isFavorited).toBe(true)
    })

    it('should replace notableEvents entirely on update', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ notableEvents: ['Brand new event'] })
        .expect(200)

      expect(response.body.notableEvents).toHaveLength(1)
      expect(response.body.notableEvents[0].description).toBe('Brand new event')
    })

    it('should clear notableEvents when passed empty array', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ notableEvents: [] })
        .expect(200)

      expect(response.body.notableEvents).toEqual([])
    })

    it('should leave notableEvents unchanged when not included in body', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ name: 'New Name Only' })
        .expect(200)

      expect(response.body.name).toBe('New Name Only')
      expect(response.body.notableEvents).toHaveLength(2)
    })

    it('should update only name', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ name: 'New Name Only' })
        .expect(200)

      expect(response.body.name).toBe('New Name Only')
      expect(response.body.description).toBe('Original Description')
      expect(response.body.isFavorited).toBe(false)
    })

    it('should update only description', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ description: 'New Description Only' })
        .expect(200)

      expect(response.body.name).toBe('Original Name')
      expect(response.body.description).toBe('New Description Only')
    })

    it('should update only isFavorited flag', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ isFavorited: true })
        .expect(200)

      expect(response.body.name).toBe('Original Name')
      expect(response.body.isFavorited).toBe(true)
    })

    it('should trim whitespace from all string fields when updating', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({
          name: '  Trimmed Name  ',
          description: '  Trimmed Description  ',
          relationship: '  Trimmed Relationship  ',
          notableEvents: ['  Trimmed event  '],
          url: '  https://trimmed.com  '
        })
        .expect(200)

      expect(response.body.name).toBe('Trimmed Name')
      expect(response.body.description).toBe('Trimmed Description')
      expect(response.body.relationship).toBe('Trimmed Relationship')
      expect(response.body.notableEvents[0].description).toBe('Trimmed event')
      expect(response.body.url).toBe('https://trimmed.com')
    })

    it('should allow setting optional fields to null', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ description: null, relationship: null, url: null })
        .expect(200)

      expect(response.body.description).toBeNull()
      expect(response.body.relationship).toBeNull()
      expect(response.body.url).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/people/abc')
        .send({ name: 'Test' })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Invalid person ID' })
    })

    it('should return 400 for empty name string', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ name: '' })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Person name is required' })
    })

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ name: '   ' })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Person name is required' })
    })

    it('should return 400 for non-string name', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ name: 123 })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Person name is required' })
    })

    it('should return 400 for non-string, non-null description', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ description: 123 })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Description must be a string or null' })
    })

    it('should return 400 for non-string, non-null relationship', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ relationship: 123 })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Relationship must be a string or null' })
    })

    it('should return 400 for non-array notableEvents', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ notableEvents: 'not an array' })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Notable events must be an array' })
    })

    it('should return 400 for notableEvents with empty string entries', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ notableEvents: [''] })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Each notable event must be a non-empty string' })
    })

    it('should return 400 for non-string, non-null url', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ url: 123 })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'URL must be a string or null' })
    })

    it('should return 400 for non-boolean isFavorited', async () => {
      const response = await request(app)
        .put(`/api/people/${person!.id}`)
        .send({ isFavorited: 'true' })
        .expect(400)

      expect(response.body).toMatchObject({ error: 'isFavorited must be a boolean' })
    })

    it('should return 404 for non-existent person', async () => {
      const response = await request(app)
        .put('/api/people/99999')
        .send({ name: 'Test' })
        .expect(404)

      expect(response.body).toMatchObject({ error: 'Person not found' })
    })
  })

  describe('DELETE /api/people/:id', () => {
    it('should delete person and cascade delete notable events', async () => {
      const person = await createTestPerson({
        name: 'To Delete',
        notableEvents: ['Event that should be deleted']
      })

      await request(app)
        .delete(`/api/people/${person!.id}`)
        .expect(204)

      const [deletedRow] = await testDb.select().from(tables.person).where(eq(tables.person.id, person!.id))
      const deleted = deletedRow ?? null
      expect(deleted).toBeNull()

      const events = await testDb.select().from(tables.personNotableEvent).where(eq(tables.personNotableEvent.personId, person!.id))
      expect(events).toHaveLength(0)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/people/abc')
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Invalid person ID' })
    })

    it('should return 404 for non-existent person', async () => {
      const response = await request(app)
        .delete('/api/people/99999')
        .expect(404)

      expect(response.body).toMatchObject({ error: 'Person not found' })
    })
  })

  describe('PATCH /api/people/:id/favorite', () => {
    it('should toggle favorite status from false to true', async () => {
      const person = await createTestPerson({ name: 'Unfavorited Person', isFavorited: false })

      const response = await request(app)
        .patch(`/api/people/${person!.id}/favorite`)
        .expect(200)

      expect(response.body.isFavorited).toBe(true)
      expect(Array.isArray(response.body.notableEvents)).toBe(true)

      const [updatedRow] = await testDb.select().from(tables.person).where(eq(tables.person.id, person!.id))
      const updated = updatedRow ?? null
      expect(updated?.isFavorited).toBe(true)
    })

    it('should toggle favorite status from true to false', async () => {
      const person = await createTestPerson({ name: 'Favorited Person', isFavorited: true })

      const response = await request(app)
        .patch(`/api/people/${person!.id}/favorite`)
        .expect(200)

      expect(response.body.isFavorited).toBe(false)

      const [updatedRow2] = await testDb.select().from(tables.person).where(eq(tables.person.id, person!.id))
      const updated = updatedRow2 ?? null
      expect(updated?.isFavorited).toBe(false)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .patch('/api/people/abc/favorite')
        .expect(400)

      expect(response.body).toMatchObject({ error: 'Invalid person ID' })
    })

    it('should return 404 for non-existent person', async () => {
      const response = await request(app)
        .patch('/api/people/99999/favorite')
        .expect(404)

      expect(response.body).toMatchObject({ error: 'Person not found' })
    })
  })
})
