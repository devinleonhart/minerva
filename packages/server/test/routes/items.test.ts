import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { createTestItem } from '../setup.js'

const app = createTestApp()

describe('Items Routes', () => {
  describe('GET /api/items', () => {
    it('should return empty array when no items exist', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all items', async () => {
      await createTestItem({ name: 'Iron Sword', description: 'A sturdy iron blade' })
      await createTestItem({ name: 'Wooden Shield', description: 'Basic protection' })

      const response = await request(app)
        .get('/api/items')
        .expect(200)

      expect(response.body).toHaveLength(2)
      expect(response.body[0]).toMatchObject({
        name: 'Iron Sword',
        description: 'A sturdy iron blade'
      })
      expect(response.body[1]).toMatchObject({
        name: 'Wooden Shield',
        description: 'Basic protection'
      })
    })
  })

  describe('GET /api/items/:id', () => {
    it('should return specific item by ID', async () => {
      const item = await createTestItem({
        name: 'Enchanted Bow',
        description: 'A bow imbued with magical properties'
      })

      const response = await request(app)
        .get(`/api/items/${item.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: item.id,
        name: 'Enchanted Bow',
        description: 'A bow imbued with magical properties'
      })
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/items/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid item ID')
    })

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/items/99999')
        .expect(404)

      expect(response.body.error).toBe('Item not found')
    })
  })

  describe('POST /api/items', () => {
    it('should create new item', async () => {
      const itemData = {
        name: 'Dragon Scale Armor',
        description: 'Armor crafted from dragon scales'
      }

      const response = await request(app)
        .post('/api/items')
        .send(itemData)
        .expect(201)

      expect(response.body).toMatchObject(itemData)
      expect(response.body.id).toBeTruthy()
      expect(response.body.createdAt).toBeTruthy()
    })

    it('should create item with minimal data', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: 'Simple Item' })
        .expect(201)

      expect(response.body.name).toBe('Simple Item')
      expect(response.body.description).toBe('') // Default empty string
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ description: 'An item without a name' })
        .expect(400)

      expect(response.body.error).toBe('Item name is required')
    })

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .expect(400)

      expect(response.body.error).toBe('Item name is required')
    })
  })

  describe('DELETE /api/items/:id', () => {
    it('should delete item', async () => {
      const item = await createTestItem({ name: 'Delete Me Item' })

      await request(app)
        .delete(`/api/items/${item.id}`)
        .expect(204)

      // Verify deletion
      await request(app)
        .get(`/api/items/${item.id}`)
        .expect(404)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/items/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid item ID')
    })

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/items/99999')
        .expect(404)

      expect(response.body.error).toBe('Item not found')
    })
  })
})
