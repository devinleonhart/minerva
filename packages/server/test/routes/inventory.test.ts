import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestIngredient, createTestInventoryItem } from '../setup.js'

const app = createTestApp()

describe('Inventory Routes', () => {
  describe('GET /api/inventory', () => {
    it('should return empty inventory when no items exist', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .expect(200)

      expect(response.body).toMatchObject({
        ingredients: [],
        potions: [],
        items: [],
        currencies: []
      })
    })

    it('should return all inventory items organized by type', async () => {
      const ingredient1 = await createTestIngredient({ name: 'Zebra Ingredient', description: 'Test' })
      const ingredient2 = await createTestIngredient({ name: 'Apple Ingredient', description: 'Test' })

      await createTestInventoryItem({ ingredientId: ingredient1.id, quantity: 5, quality: 'NORMAL' })
      await createTestInventoryItem({ ingredientId: ingredient2.id, quantity: 3, quality: 'HQ' })

      const response = await request(app)
        .get('/api/inventory')
        .expect(200)

      expect(response.body).toHaveProperty('ingredients')
      expect(response.body).toHaveProperty('potions')
      expect(response.body).toHaveProperty('items')
      expect(response.body).toHaveProperty('currencies')
      expect(response.body.ingredients).toHaveLength(2)
      // Ingredients should be ordered by ingredient name
      expect(response.body.ingredients[0].ingredient.name).toBe('Apple Ingredient')
      expect(response.body.ingredients[1].ingredient.name).toBe('Zebra Ingredient')
    })
  })

  describe('POST /api/inventory', () => {
    let ingredient: Awaited<ReturnType<typeof createTestIngredient>>

    beforeEach(async () => {
      ingredient = await createTestIngredient({
        name: 'Test Ingredient',
        description: 'Test Description'
      })
    })

    it('should create new inventory item with all fields', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id,
          quantity: 10,
          quality: 'HQ'
        })
        .expect(201)

      expect(response.body).toMatchObject({
        ingredientId: ingredient.id,
        quantity: 10,
        quality: 'HQ'
      })
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('ingredient')
      expect(response.body.ingredient.name).toBe('Test Ingredient')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')

      // Verify it was actually created in the database
      const inventoryItem = await testPrisma.inventoryItem.findUnique({
        where: { id: response.body.id }
      })
      expect(inventoryItem).toBeTruthy()
      expect(inventoryItem?.quantity).toBe(10)
      expect(inventoryItem?.quality).toBe('HQ')
    })

    it('should create inventory item with default quantity and quality', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id
        })
        .expect(201)

      expect(response.body.quantity).toBe(1)
      expect(response.body.quality).toBe('NORMAL')
    })

    it('should merge quantities when item with same quality already exists', async () => {
      // Create initial inventory item
      const existing = await createTestInventoryItem({
        ingredientId: ingredient.id,
        quantity: 5,
        quality: 'NORMAL'
      })

      // Add more of the same quality
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id,
          quantity: 3,
          quality: 'NORMAL'
        })
        .expect(200)

      // Should update existing item, not create new one
      expect(response.body.id).toBe(existing.id)
      expect(response.body.quantity).toBe(8) // 5 + 3

      // Verify only one item exists
      const items = await testPrisma.inventoryItem.findMany({
        where: { ingredientId: ingredient.id, quality: 'NORMAL' }
      })
      expect(items).toHaveLength(1)
    })

    it('should create separate items for different qualities', async () => {
      await createTestInventoryItem({
        ingredientId: ingredient.id,
        quantity: 5,
        quality: 'NORMAL'
      })

      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id,
          quantity: 3,
          quality: 'HQ'
        })
        .expect(201)

      expect(response.body.quality).toBe('HQ')
      expect(response.body.quantity).toBe(3)

      // Verify both items exist
      const items = await testPrisma.inventoryItem.findMany({
        where: { ingredientId: ingredient.id }
      })
      expect(items).toHaveLength(2)
    })

    it('should return 400 for missing ingredientId', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          quantity: 5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'ingredientId is required'
      })
    })

    it('should return 400 for invalid quality value', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id,
          quality: 'INVALID'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid quality. Must be NORMAL, HQ, or LQ'
      })
    })

    it('should return 400 for null quality', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id,
          quality: null
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid quality. Must be NORMAL, HQ, or LQ'
      })
    })

    it('should return 400 for empty string quality', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id,
          quality: ''
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid quality. Must be NORMAL, HQ, or LQ'
      })
    })

    it('should return 400 for non-string quality', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id,
          quality: 123
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid quality. Must be NORMAL, HQ, or LQ'
      })
    })

    it('should return 404 for non-existent ingredient', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: 99999,
          quantity: 5
        })
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Ingredient not found'
      })
    })

    it('should accept all valid quality values', async () => {
      for (const quality of ['NORMAL', 'HQ', 'LQ'] as const) {
        const testIngredient = await createTestIngredient({
          name: `Test ${quality}`,
          description: 'Test'
        })

        const response = await request(app)
          .post('/api/inventory')
          .send({
            ingredientId: testIngredient.id,
            quality
          })
          .expect(201)

        expect(response.body.quality).toBe(quality)
      }
    })

    it('should return 400 for negative quantity', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id,
          quantity: -1
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Quantity must be a non-negative integer'
      })
    })

    it('should return 400 for non-integer quantity', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id,
          quantity: 5.5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Quantity must be a non-negative integer'
      })
    })
  })

  describe('PUT /api/inventory/:id', () => {
    let ingredient: Awaited<ReturnType<typeof createTestIngredient>>
    let inventoryItem: Awaited<ReturnType<typeof createTestInventoryItem>>

    beforeEach(async () => {
      ingredient = await createTestIngredient({
        name: 'Test Ingredient',
        description: 'Test Description'
      })
      inventoryItem = await createTestInventoryItem({
        ingredientId: ingredient.id,
        quantity: 5,
        quality: 'NORMAL'
      })
    })

    it('should update all fields', async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem.id}`)
        .send({
          quantity: 10,
          quality: 'HQ'
        })
        .expect(200)

      expect(response.body).toMatchObject({
        id: inventoryItem.id,
        quantity: 10,
        quality: 'HQ'
      })
      expect(response.body).toHaveProperty('ingredient')

      // Verify in database
      const updated = await testPrisma.inventoryItem.findUnique({
        where: { id: inventoryItem.id }
      })
      expect(updated?.quantity).toBe(10)
      expect(updated?.quality).toBe('HQ')
    })

    it('should update only quantity', async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem.id}`)
        .send({
          quantity: 15
        })
        .expect(200)

      expect(response.body.quantity).toBe(15)
      expect(response.body.quality).toBe('NORMAL') // Unchanged
    })

    it('should update only quality', async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem.id}`)
        .send({
          quality: 'LQ'
        })
        .expect(200)

      expect(response.body.quality).toBe('LQ')
      expect(response.body.quantity).toBe(5) // Unchanged
    })

    it('should accept quantity of zero', async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem.id}`)
        .send({
          quantity: 0
        })
        .expect(200)

      expect(response.body.quantity).toBe(0)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/inventory/abc')
        .send({
          quantity: 10
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid inventory item ID'
      })
    })

    it('should return 400 for negative quantity', async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem.id}`)
        .send({
          quantity: -1
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Quantity must be a non-negative integer'
      })
    })

    it('should return 400 for non-integer quantity', async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem.id}`)
        .send({
          quantity: 5.5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Quantity must be a non-negative integer'
      })
    })

    it('should return 400 for invalid quality value', async () => {
      const response = await request(app)
        .put(`/api/inventory/${inventoryItem.id}`)
        .send({
          quality: 'INVALID'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid quality. Must be NORMAL, HQ, or LQ'
      })
    })

    it('should accept all valid quality values', async () => {
      for (const quality of ['NORMAL', 'HQ', 'LQ'] as const) {
        const response = await request(app)
          .put(`/api/inventory/${inventoryItem.id}`)
          .send({ quality })
          .expect(200)

        expect(response.body.quality).toBe(quality)
      }
    })

    it('should return 404 for non-existent inventory item', async () => {
      const response = await request(app)
        .put('/api/inventory/99999')
        .send({
          quantity: 10
        })
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Inventory item not found'
      })
    })
  })

  describe('DELETE /api/inventory/:id', () => {
    it('should delete inventory item successfully', async () => {
      const ingredient = await createTestIngredient({
        name: 'To Delete',
        description: 'Will be deleted'
      })
      const inventoryItem = await createTestInventoryItem({
        ingredientId: ingredient.id,
        quantity: 5
      })

      await request(app)
        .delete(`/api/inventory/${inventoryItem.id}`)
        .expect(204)

      // Verify it was deleted
      const deleted = await testPrisma.inventoryItem.findUnique({
        where: { id: inventoryItem.id }
      })
      expect(deleted).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/inventory/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid inventory item ID'
      })
    })

    it('should return 404 for non-existent inventory item', async () => {
      const response = await request(app)
        .delete('/api/inventory/99999')
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Inventory item not found'
      })
    })
  })
})
