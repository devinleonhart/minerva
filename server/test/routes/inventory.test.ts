import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testDb, createTestIngredient, createTestInventoryItem, createTestItem, createTestCurrency, createTestRecipe } from '../setup.js'
import { eq, and } from 'drizzle-orm'
import * as tables from '../../db/index.js'

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
      const [invItemRow] = await testDb.select().from(tables.inventoryItem).where(eq(tables.inventoryItem.id, response.body.id))
      const inventoryItem = invItemRow ?? null
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
      const items = await testDb.select().from(tables.inventoryItem).where(and(eq(tables.inventoryItem.ingredientId, ingredient.id), eq(tables.inventoryItem.quality, 'NORMAL')))
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
      const items = await testDb.select().from(tables.inventoryItem).where(eq(tables.inventoryItem.ingredientId, ingredient.id))
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
      const [updatedRow] = await testDb.select().from(tables.inventoryItem).where(eq(tables.inventoryItem.id, inventoryItem.id))
      const updated = updatedRow ?? null
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
      const [deletedRow] = await testDb.select().from(tables.inventoryItem).where(eq(tables.inventoryItem.id, inventoryItem.id))
      const deleted = deletedRow ?? null
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

  // Currency Routes
  describe('POST /api/inventory/currency', () => {
    it('should create a new currency', async () => {
      const response = await request(app)
        .post('/api/inventory/currency')
        .send({
          name: 'Gold',
          value: 100
        })
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'Gold',
        value: 100
      })
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('createdAt')
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/inventory/currency')
        .send({
          value: 100
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Currency name is required and must be a string'
      })
    })

    it('should return 400 for non-string name', async () => {
      const response = await request(app)
        .post('/api/inventory/currency')
        .send({
          name: 123,
          value: 100
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Currency name is required and must be a string'
      })
    })

    it('should return 400 for missing value', async () => {
      const response = await request(app)
        .post('/api/inventory/currency')
        .send({
          name: 'Gold'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Currency value must be a non-negative integer'
      })
    })

    it('should return 400 for negative value', async () => {
      const response = await request(app)
        .post('/api/inventory/currency')
        .send({
          name: 'Gold',
          value: -10
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Currency value must be a non-negative integer'
      })
    })

    it('should return 400 for non-integer value', async () => {
      const response = await request(app)
        .post('/api/inventory/currency')
        .send({
          name: 'Gold',
          value: 10.5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Currency value must be a non-negative integer'
      })
    })

    it('should return 409 for duplicate currency name', async () => {
      await createTestCurrency({ name: 'Gold', value: 50 })

      const response = await request(app)
        .post('/api/inventory/currency')
        .send({
          name: 'Gold',
          value: 100
        })
        .expect(409)

      expect(response.body).toMatchObject({
        error: 'A currency with this name already exists'
      })
    })
  })

  describe('PUT /api/inventory/currency/:id', () => {
    let currency: Awaited<ReturnType<typeof createTestCurrency>>

    beforeEach(async () => {
      currency = await createTestCurrency({ name: 'Gold', value: 100 })
    })

    it('should update currency name', async () => {
      const response = await request(app)
        .put(`/api/inventory/currency/${currency.id}`)
        .send({
          name: 'Silver'
        })
        .expect(200)

      expect(response.body).toMatchObject({
        id: currency.id,
        name: 'Silver',
        value: 100
      })
    })

    it('should update currency value', async () => {
      const response = await request(app)
        .put(`/api/inventory/currency/${currency.id}`)
        .send({
          value: 200
        })
        .expect(200)

      expect(response.body).toMatchObject({
        id: currency.id,
        name: 'Gold',
        value: 200
      })
    })

    it('should update both name and value', async () => {
      const response = await request(app)
        .put(`/api/inventory/currency/${currency.id}`)
        .send({
          name: 'Platinum',
          value: 500
        })
        .expect(200)

      expect(response.body).toMatchObject({
        name: 'Platinum',
        value: 500
      })
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/inventory/currency/abc')
        .send({
          value: 200
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid currency ID'
      })
    })

    it('should return 400 for empty string name', async () => {
      const response = await request(app)
        .put(`/api/inventory/currency/${currency.id}`)
        .send({
          name: ''
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Currency name must be a non-empty string'
      })
    })

    it('should return 400 for negative value', async () => {
      const response = await request(app)
        .put(`/api/inventory/currency/${currency.id}`)
        .send({
          value: -10
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Currency value must be a non-negative number'
      })
    })

    it('should return 404 for non-existent currency', async () => {
      const response = await request(app)
        .put('/api/inventory/currency/99999')
        .send({
          value: 200
        })
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Currency not found'
      })
    })
  })

  describe('DELETE /api/inventory/currency/:id', () => {
    it('should delete currency successfully', async () => {
      const currency = await createTestCurrency({ name: 'Gold', value: 100 })

      await request(app)
        .delete(`/api/inventory/currency/${currency.id}`)
        .expect(204)

      const [currencyDeletedRow] = await testDb.select().from(tables.currency).where(eq(tables.currency.id, currency.id))
      const deleted = currencyDeletedRow ?? null
      expect(deleted).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/inventory/currency/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid currency ID'
      })
    })

    it('should return 404 for non-existent currency', async () => {
      const response = await request(app)
        .delete('/api/inventory/currency/99999')
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Currency not found'
      })
    })
  })

  // Item Inventory Routes
  describe('POST /api/inventory/item', () => {
    it('should create a new item and add to inventory', async () => {
      const response = await request(app)
        .post('/api/inventory/item')
        .send({
          name: 'Magic Wand',
          description: 'A powerful wand',
          quantity: 5
        })
        .expect(201)

      expect(response.body).toMatchObject({
        quantity: 5
      })
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('item')
      expect(response.body.item.name).toBe('Magic Wand')
      expect(response.body.item.description).toBe('A powerful wand')
    })

    it('should create item with default quantity of 1', async () => {
      const response = await request(app)
        .post('/api/inventory/item')
        .send({
          name: 'Scroll',
          description: 'A magic scroll'
        })
        .expect(201)

      expect(response.body.quantity).toBe(1)
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/inventory/item')
        .send({
          description: 'A description'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'name and description are required'
      })
    })

    it('should return 400 for missing description', async () => {
      const response = await request(app)
        .post('/api/inventory/item')
        .send({
          name: 'Item Name'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'name and description are required'
      })
    })

    it('should return 400 for quantity less than 1', async () => {
      const response = await request(app)
        .post('/api/inventory/item')
        .send({
          name: 'Item',
          description: 'Description',
          quantity: 0
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'quantity must be a positive integer'
      })
    })

    it('should return 400 for non-integer quantity', async () => {
      const response = await request(app)
        .post('/api/inventory/item')
        .send({
          name: 'Item',
          description: 'Description',
          quantity: 2.5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'quantity must be a positive integer'
      })
    })
  })

  describe('PUT /api/inventory/item/:id', () => {
    let itemInventory: { id: number; quantity: number; item: { id: number; name: string } }

    beforeEach(async () => {
      const item = await createTestItem({ name: 'Test Item', description: 'Test' })
      const [createdInvItem] = await testDb.insert(tables.itemInventoryItem).values({
        itemId: item.id,
        quantity: 5,
        updatedAt: new Date().toISOString()
      }).returning()
      const [itemRow] = await testDb.select().from(tables.item).where(eq(tables.item.id, item.id))
      itemInventory = { ...createdInvItem, item: itemRow }
    })

    it('should update item quantity', async () => {
      const response = await request(app)
        .put(`/api/inventory/item/${itemInventory.id}`)
        .send({
          quantity: 10
        })
        .expect(200)

      expect(response.body).toMatchObject({
        id: itemInventory.id,
        quantity: 10
      })
      expect(response.body.item.name).toBe('Test Item')
    })

    it('should allow setting quantity to 0', async () => {
      const response = await request(app)
        .put(`/api/inventory/item/${itemInventory.id}`)
        .send({
          quantity: 0
        })
        .expect(200)

      expect(response.body.quantity).toBe(0)
    })

    it('should return 400 for missing quantity', async () => {
      const response = await request(app)
        .put(`/api/inventory/item/${itemInventory.id}`)
        .send({})
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'quantity is required'
      })
    })

    it('should return 400 for negative quantity', async () => {
      const response = await request(app)
        .put(`/api/inventory/item/${itemInventory.id}`)
        .send({
          quantity: -1
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'quantity must be a non-negative integer'
      })
    })

    it('should return 400 for non-integer quantity', async () => {
      const response = await request(app)
        .put(`/api/inventory/item/${itemInventory.id}`)
        .send({
          quantity: 5.5
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'quantity must be a non-negative integer'
      })
    })

    it('should return 404 for non-existent item inventory', async () => {
      const response = await request(app)
        .put('/api/inventory/item/99999')
        .send({
          quantity: 10
        })
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Item inventory item not found'
      })
    })
  })

  describe('DELETE /api/inventory/item/:id', () => {
    it('should delete item from inventory', async () => {
      const item = await createTestItem({ name: 'To Delete', description: 'Test' })
      const [itemInventory] = await testDb.insert(tables.itemInventoryItem).values({
        itemId: item.id,
        quantity: 1,
        updatedAt: new Date().toISOString()
      }).returning()

      const response = await request(app)
        .delete(`/api/inventory/item/${itemInventory.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        message: 'Item removed from inventory'
      })

      const [itemInvDeletedRow] = await testDb.select().from(tables.itemInventoryItem).where(eq(tables.itemInventoryItem.id, itemInventory.id))
      const deleted = itemInvDeletedRow ?? null
      expect(deleted).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/inventory/item/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid ID'
      })
    })
  })

  // Potion Inventory Routes
  describe('PUT /api/inventory/potion/:id', () => {
    let potionInventory: { id: number; quantity: number; potionId: number }

    beforeEach(async () => {
      const recipe = await createTestRecipe({ name: 'Health Potion Recipe', description: 'Test' })
      const [potion] = await testDb.insert(tables.potion).values({
        recipeId: recipe.id,
        quality: 'NORMAL',
        updatedAt: new Date().toISOString()
      }).returning()
      const [created] = await testDb.insert(tables.potionInventoryItem).values({
        potionId: potion.id,
        quantity: 5,
        updatedAt: new Date().toISOString()
      }).returning()
      potionInventory = created
    })

    it('should update potion quantity', async () => {
      const response = await request(app)
        .put(`/api/inventory/potion/${potionInventory.id}`)
        .send({
          quantity: 10
        })
        .expect(200)

      expect(response.body).toMatchObject({
        id: potionInventory.id,
        quantity: 10
      })
      expect(response.body).toHaveProperty('potion')
      expect(response.body.potion).toHaveProperty('recipe')
    })

    it('should delete potion from inventory when quantity is 0', async () => {
      const response = await request(app)
        .put(`/api/inventory/potion/${potionInventory.id}`)
        .send({
          quantity: 0
        })
        .expect(200)

      expect(response.body).toMatchObject({
        message: 'Potion removed from inventory'
      })

      const [potInvDelRow] = await testDb.select().from(tables.potionInventoryItem).where(eq(tables.potionInventoryItem.id, potionInventory.id))
      const deleted = potInvDelRow ?? null
      expect(deleted).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/inventory/potion/abc')
        .send({
          quantity: 10
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid ID'
      })
    })

    it('should return 400 for negative quantity', async () => {
      const response = await request(app)
        .put(`/api/inventory/potion/${potionInventory.id}`)
        .send({
          quantity: -1
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Quantity must be a non-negative number'
      })
    })

    it('should return 400 for non-number quantity', async () => {
      const response = await request(app)
        .put(`/api/inventory/potion/${potionInventory.id}`)
        .send({
          quantity: 'ten'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Quantity must be a non-negative number'
      })
    })
  })

  describe('DELETE /api/inventory/potion/:id', () => {
    it('should delete potion from inventory', async () => {
      const recipe = await createTestRecipe({ name: 'Delete Potion Recipe', description: 'Test' })
      const [potion] = await testDb.insert(tables.potion).values({
        recipeId: recipe.id,
        quality: 'NORMAL',
        updatedAt: new Date().toISOString()
      }).returning()
      const [potionInventory] = await testDb.insert(tables.potionInventoryItem).values({
        potionId: potion.id,
        quantity: 1,
        updatedAt: new Date().toISOString()
      }).returning()

      const response = await request(app)
        .delete(`/api/inventory/potion/${potionInventory.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        message: 'Potion removed from inventory'
      })

      const [potInvDelRow2] = await testDb.select().from(tables.potionInventoryItem).where(eq(tables.potionInventoryItem.id, potionInventory.id))
      const deleted = potInvDelRow2 ?? null
      expect(deleted).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/inventory/potion/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid ID'
      })
    })
  })
})
