import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestIngredient, createTestCurrency } from '../setup.js'

const app = createTestApp()

describe('Inventory Routes', () => {
  beforeEach(async () => {
    await testPrisma.potionInventoryItem.deleteMany()
    await testPrisma.itemInventoryItem.deleteMany()
    await testPrisma.inventoryItem.deleteMany()
    await testPrisma.ingredient.deleteMany()
    await testPrisma.item.deleteMany()
    await testPrisma.currency.deleteMany()
  })

  afterEach(async () => {
    await testPrisma.potionInventoryItem.deleteMany()
    await testPrisma.itemInventoryItem.deleteMany()
    await testPrisma.inventoryItem.deleteMany()
    await testPrisma.ingredient.deleteMany()
    await testPrisma.item.deleteMany()
    await testPrisma.currency.deleteMany()
  })

  describe('GET /api/inventory', () => {
    it('should return empty inventory when no data exists', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .expect(200)

      expect(response.body).toEqual({
        ingredients: [],
        potions: [],
        items: [],
        currencies: []
      })
    })

    it('should return inventory with all types of items', async () => {
      // Create test data
      const ingredient = await createTestIngredient({ name: 'Test Herb' })
      const currency = await createTestCurrency({ name: 'Gold', value: 100 })

      // Create inventory items
      const inventoryItem = await testPrisma.inventoryItem.create({
        data: {
          ingredientId: ingredient.id,
          quantity: 5,
          quality: 'NORMAL'
        },
        include: { ingredient: true }
      })

      const response = await request(app)
        .get('/api/inventory')
        .expect(200)

      expect(response.body.ingredients).toHaveLength(1)
      expect(response.body.ingredients[0]).toMatchObject({
        id: inventoryItem.id,
        quantity: 5,
        quality: 'NORMAL',
        ingredient: {
          id: ingredient.id,
          name: 'Test Herb'
        }
      })

      expect(response.body.currencies).toHaveLength(1)
      expect(response.body.currencies[0]).toMatchObject({
        id: currency.id,
        name: 'Gold',
        value: 100
      })
    })
  })

  describe('POST /api/inventory', () => {
    it('should create new inventory item', async () => {
      const ingredient = await createTestIngredient({ name: 'Magic Herb' })

      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id,
          quantity: 3,
          quality: 'HQ'
        })
        .expect(200)

      expect(response.body).toMatchObject({
        quantity: 3,
        quality: 'HQ',
        ingredient: {
          id: ingredient.id,
          name: 'Magic Herb'
        }
      })

      // Verify in database
      const dbItem = await testPrisma.inventoryItem.findFirst({
        where: { ingredientId: ingredient.id },
        include: { ingredient: true }
      })
      expect(dbItem).toBeTruthy()
      expect(dbItem?.quantity).toBe(3)
    })

    it('should update existing inventory item quantity', async () => {
      const ingredient = await createTestIngredient({ name: 'Common Herb' })

      // Create initial inventory item
      await testPrisma.inventoryItem.create({
        data: {
          ingredientId: ingredient.id,
          quantity: 5,
          quality: 'NORMAL'
        }
      })

      // Add more of the same ingredient (should consolidate)
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id,
          quantity: 3
        })
        .expect(200)

      expect(response.body.quantity).toBe(8) // 5 + 3
    })

    it('should return 400 for missing ingredientId', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          quantity: 5,
          quality: 'NORMAL'
        })
        .expect(400)

      expect(response.body.error).toBe('ingredientId is required')
    })

    it('should return 400 for invalid quality', async () => {
      const ingredient = await createTestIngredient({ name: 'Test Herb' })

      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: ingredient.id,
          quantity: 5,
          quality: 'INVALID'
        })
        .expect(400)

      expect(response.body.error).toBe('Invalid quality. Must be NORMAL, HQ, or LQ')
    })

    it('should return 404 for non-existent ingredient', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: 99999,
          quantity: 5
        })
        .expect(404)

      expect(response.body.error).toBe('Ingredient not found')
    })
  })

  describe('PUT /api/inventory/:id', () => {
    it('should update inventory item successfully', async () => {
      const ingredient = await createTestIngredient({ name: 'Update Test Herb' })
      const inventoryItem = await testPrisma.inventoryItem.create({
        data: {
          ingredientId: ingredient.id,
          quantity: 5,
          quality: 'NORMAL'
        }
      })

      const updateData = {
        quantity: 10,
        quality: 'HQ'
      }

      const response = await request(app)
        .put(`/api/inventory/${inventoryItem.id}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject(updateData)
      expect(response.body.id).toBe(inventoryItem.id)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/inventory/invalid')
        .send({ quantity: 10 })
        .expect(400)

      expect(response.body.error).toBe('Invalid inventory item ID')
    })

    it('should return 404 for non-existent inventory item', async () => {
      const response = await request(app)
        .put('/api/inventory/99999')
        .send({ quantity: 10 })
        .expect(404)

      expect(response.body.error).toBe('Inventory item not found')
    })

    it('should return 400 for invalid quality', async () => {
      const ingredient = await createTestIngredient({ name: 'Quality Test Herb' })
      const inventoryItem = await testPrisma.inventoryItem.create({
        data: {
          ingredientId: ingredient.id,
          quantity: 5,
          quality: 'NORMAL'
        }
      })

      const response = await request(app)
        .put(`/api/inventory/${inventoryItem.id}`)
        .send({ quality: 'INVALID' })
        .expect(400)

      expect(response.body.error).toBe('Invalid quality. Must be NORMAL, HQ, or LQ')
    })
  })

  describe('DELETE /api/inventory/:id', () => {
    it('should delete inventory item successfully', async () => {
      const ingredient = await createTestIngredient({ name: 'Delete Test Herb' })
      const inventoryItem = await testPrisma.inventoryItem.create({
        data: {
          ingredientId: ingredient.id,
          quantity: 5,
          quality: 'NORMAL'
        }
      })

      await request(app)
        .delete(`/api/inventory/${inventoryItem.id}`)
        .expect(204)

      // Verify deletion
      const getResponse = await request(app)
        .get('/api/inventory')
        .expect(200)

      expect(getResponse.body.ingredients).toHaveLength(0)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/inventory/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid inventory item ID')
    })

    it('should return 404 for non-existent inventory item', async () => {
      const response = await request(app)
        .delete('/api/inventory/99999')
        .expect(404)

      expect(response.body.error).toBe('Inventory item not found')
    })
  })

  describe('Item Operations', () => {
    describe('POST /api/inventory/item', () => {
      it('should create new item successfully', async () => {
        const itemData = {
          name: 'Magic Ring',
          description: 'A powerful magical ring'
        }

        const response = await request(app)
          .post('/api/inventory/item')
          .send(itemData)
          .expect(201)

        expect(response.body).toMatchObject({
          quantity: 1,
          item: {
            name: itemData.name,
            description: itemData.description
          }
        })
        expect(response.body.id).toBeTruthy()
        expect(response.body.item.id).toBeTruthy()
      })

      it('should create item with custom quantity', async () => {
        const itemData = {
          name: 'Health Potion',
          description: 'Restores health',
          quantity: 5
        }

        const response = await request(app)
          .post('/api/inventory/item')
          .send(itemData)
          .expect(201)

        expect(response.body.quantity).toBe(5)
        expect(response.body.item.name).toBe(itemData.name)
      })

      it('should return 400 for missing name', async () => {
        const response = await request(app)
          .post('/api/inventory/item')
          .send({ description: 'A test item' })
          .expect(400)

        expect(response.body.error).toBe('name and description are required')
      })

      it('should return 400 for missing description', async () => {
        const response = await request(app)
          .post('/api/inventory/item')
          .send({ name: 'Test Item' })
          .expect(400)

        expect(response.body.error).toBe('name and description are required')
      })

      it('should return 400 for invalid quantity', async () => {
        const response = await request(app)
          .post('/api/inventory/item')
          .send({
            name: 'Test Item',
            description: 'A test item',
            quantity: 0
          })
          .expect(400)

        expect(response.body.error).toBe('quantity must be a positive integer')
      })
    })

    describe('PUT /api/inventory/item/:id', () => {
      it('should update item quantity successfully', async () => {
        // First create an item
        const createResponse = await request(app)
          .post('/api/inventory/item')
          .send({
            name: 'Test Item',
            description: 'A test item'
          })
          .expect(201)

        const itemId = createResponse.body.id

        // Update quantity
        const updateResponse = await request(app)
          .put(`/api/inventory/item/${itemId}`)
          .send({ quantity: 5 })
          .expect(200)

        expect(updateResponse.body.quantity).toBe(5)
        expect(updateResponse.body.id).toBe(itemId)
      })

      it('should return 400 for missing quantity', async () => {
        const response = await request(app)
          .put('/api/inventory/item/1')
          .send({})
          .expect(400)

        expect(response.body.error).toBe('quantity is required')
      })

      it('should return 400 for invalid quantity', async () => {
        const response = await request(app)
          .put('/api/inventory/item/1')
          .send({ quantity: -1 })
          .expect(400)

        expect(response.body.error).toBe('quantity must be a non-negative integer')
      })

      it('should return 404 for non-existent item', async () => {
        const response = await request(app)
          .put('/api/inventory/item/99999')
          .send({ quantity: 5 })
          .expect(404)

        expect(response.body.error).toBe('Item inventory item not found')
      })
    })
  })

  describe('Currency Operations', () => {
    describe('POST /api/inventory/currency', () => {
      it('should create new currency successfully', async () => {
        const currencyData = {
          name: 'Silver',
          value: 50
        }

        const response = await request(app)
          .post('/api/inventory/currency')
          .send(currencyData)
          .expect(201)

        expect(response.body).toMatchObject(currencyData)
        expect(response.body.id).toBeTruthy()
      })

      it('should return 400 for missing name', async () => {
        const response = await request(app)
          .post('/api/inventory/currency')
          .send({ value: 100 })
          .expect(400)

        expect(response.body.error).toBe('Currency name is required and must be a string')
      })

      it('should return 400 for negative value', async () => {
        const response = await request(app)
          .post('/api/inventory/currency')
          .send({ name: 'Gold', value: -10 })
          .expect(400)

        expect(response.body.error).toBe('Currency value must be a non-negative integer')
      })

      it('should allow currency with value 0', async () => {
        const response = await request(app)
          .post('/api/inventory/currency')
          .send({ name: 'Empty Coins', value: 0 })
          .expect(201)

        expect(response.body.name).toBe('Empty Coins')
        expect(response.body.value).toBe(0)
        expect(response.body.id).toBeTruthy()
      })

      it('should return 409 for duplicate currency name', async () => {
        await createTestCurrency({ name: 'Gold', value: 100 })

        const response = await request(app)
          .post('/api/inventory/currency')
          .send({ name: 'Gold', value: 200 })
          .expect(409)

        expect(response.body.error).toBe('A currency with this name already exists')
      })
    })

    describe('PUT /api/inventory/currency/:id', () => {
      it('should update currency successfully', async () => {
        const currency = await createTestCurrency({ name: 'Test Gold', value: 100 })

        const updateData = { value: 200 }

        const response = await request(app)
          .put(`/api/inventory/currency/${currency.id}`)
          .send(updateData)
          .expect(200)

        expect(response.body.value).toBe(200)
        expect(response.body.id).toBe(currency.id)
      })

      it('should return 400 for invalid ID', async () => {
        const response = await request(app)
          .put('/api/inventory/currency/invalid')
          .send({ value: 200 })
          .expect(400)

        expect(response.body.error).toBe('Invalid currency ID')
      })

      it('should return 404 for non-existent currency', async () => {
        const response = await request(app)
          .put('/api/inventory/currency/99999')
          .send({ value: 200 })
          .expect(404)

        expect(response.body.error).toBe('Currency not found')
      })
    })

    describe('DELETE /api/inventory/currency/:id', () => {
      it('should delete currency successfully', async () => {
        const currency = await createTestCurrency({ name: 'Delete Test Gold', value: 100 })

        await request(app)
          .delete(`/api/inventory/currency/${currency.id}`)
          .expect(204)

        // Verify deletion
        const getResponse = await request(app)
          .get('/api/inventory')
          .expect(200)

        expect(getResponse.body.currencies).toHaveLength(0)
      })

      it('should return 400 for invalid ID', async () => {
        const response = await request(app)
          .delete('/api/inventory/currency/invalid')
          .expect(400)

        expect(response.body.error).toBe('Invalid currency ID')
      })

      it('should return 404 for non-existent currency', async () => {
        const response = await request(app)
          .delete('/api/inventory/currency/99999')
          .expect(404)

        expect(response.body.error).toBe('Currency not found')
      })
    })
  })
})
