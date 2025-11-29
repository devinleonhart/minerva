import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestItem } from '../setup.js'

const app = createTestApp()

describe('Items Routes', () => {
  describe('GET /api/items', () => {
    it('should return empty array when no items exist', async () => {
      const response = await request(app)
        .get('/api/items')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all items ordered by name', async () => {
      await createTestItem({
        name: 'Zebra Item',
        description: 'Description 1'
      })
      await createTestItem({
        name: 'Apple Item',
        description: 'Description 2'
      })
      await createTestItem({
        name: 'Banana Item',
        description: 'Description 3'
      })

      const response = await request(app)
        .get('/api/items')
        .expect(200)

      expect(response.body).toHaveLength(3)
      // Verify ordering by name (ascending)
      expect(response.body[0].name).toBe('Apple Item')
      expect(response.body[1].name).toBe('Banana Item')
      expect(response.body[2].name).toBe('Zebra Item')
    })
  })

  describe('GET /api/items/:id', () => {
    it('should return specific item by ID', async () => {
      const item = await createTestItem({
        name: 'Test Item',
        description: 'Test Description'
      })

      const response = await request(app)
        .get(`/api/items/${item.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: item.id,
        name: 'Test Item',
        description: 'Test Description'
      })
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
    })

    it('should return 400 for invalid ID (non-numeric)', async () => {
      const response = await request(app)
        .get('/api/items/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid item ID'
      })
    })

    it('should return 400 for invalid ID (negative number)', async () => {
      const response = await request(app)
        .get('/api/items/-1')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid item ID'
      })
    })

    it('should return 400 for invalid ID (zero)', async () => {
      const response = await request(app)
        .get('/api/items/0')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid item ID'
      })
    })

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/items/99999')
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Item not found'
      })
    })
  })

  describe('POST /api/items', () => {
    it('should create new item with all fields', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: 'New Item',
          description: 'New Description'
        })
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'New Item',
        description: 'New Description'
      })
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
      expect(response.body).toHaveProperty('inventoryItems')
      expect(response.body.inventoryItems).toHaveLength(1)
      expect(response.body.inventoryItems[0].quantity).toBe(0)

      // Verify it was actually created in the database
      const item = await testPrisma.item.findUnique({
        where: { id: response.body.id }
      })
      expect(item).toBeTruthy()
      expect(item?.name).toBe('New Item')

      // Verify inventory item was created
      const inventoryItems = await testPrisma.itemInventoryItem.findMany({
        where: { itemId: response.body.id }
      })
      expect(inventoryItems).toHaveLength(1)
      expect(inventoryItems[0].quantity).toBe(0)
    })

    it('should create item with default empty description when not provided', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: 'Item Without Description'
        })
        .expect(201)

      expect(response.body.description).toBe('')
    })

    it('should trim whitespace from name and description', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: '  Trimmed Item  ',
          description: '  Trimmed Description  '
        })
        .expect(201)

      expect(response.body.name).toBe('Trimmed Item')
      expect(response.body.description).toBe('Trimmed Description')
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          description: 'Description'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Item name is required'
      })
    })

    it('should return 400 for empty name string', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: '',
          description: 'Description'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Item name is required'
      })
    })

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: '   ',
          description: 'Description'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Item name is required'
      })
    })

    it('should return 400 for non-string name', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: 123,
          description: 'Description'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Item name is required'
      })
    })

    it('should return 400 for non-string description', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: 'Test Item',
          description: 123
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Item description must be a string'
      })
    })

    it('should accept empty string description', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({
          name: 'Test Item',
          description: ''
        })
        .expect(201)

      expect(response.body.description).toBe('')
    })
  })

  describe('DELETE /api/items/:id', () => {
    it('should delete item successfully when no inventory items exist', async () => {
      const item = await createTestItem({
        name: 'To Delete',
        description: 'Will be deleted'
      })

      await request(app)
        .delete(`/api/items/${item.id}`)
        .expect(204)

      // Verify it was deleted
      const deleted = await testPrisma.item.findUnique({
        where: { id: item.id }
      })
      expect(deleted).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/items/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid item ID'
      })
    })

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/items/99999')
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Item not found'
      })
    })

    it('should return 400 when item has inventory items', async () => {
      const item = await createTestItem({
        name: 'Item With Inventory',
        description: 'Has inventory items'
      })

      // Manually create an inventory item (the POST endpoint does this automatically)
      await testPrisma.itemInventoryItem.create({
        data: {
          itemId: item.id,
          quantity: 5
        }
      })

      const response = await request(app)
        .delete(`/api/items/${item.id}`)
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Cannot delete item that has inventory items',
        inventoryItemCount: 1
      })

      // Verify item still exists
      const stillExists = await testPrisma.item.findUnique({
        where: { id: item.id }
      })
      expect(stillExists).toBeTruthy()
    })

    it('should return 400 when item has multiple inventory items', async () => {
      const item = await createTestItem({
        name: 'Item With Multiple Inventory',
        description: 'Has multiple inventory items'
      })

      // Create multiple inventory items
      await testPrisma.itemInventoryItem.create({
        data: {
          itemId: item.id,
          quantity: 3
        }
      })
      await testPrisma.itemInventoryItem.create({
        data: {
          itemId: item.id,
          quantity: 7
        }
      })

      // Verify we have 2 inventory items
      const allInventoryItems = await testPrisma.itemInventoryItem.findMany({
        where: { itemId: item.id }
      })
      expect(allInventoryItems).toHaveLength(2)

      const response = await request(app)
        .delete(`/api/items/${item.id}`)
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Cannot delete item that has inventory items',
        inventoryItemCount: 2
      })
    })
  })
})
