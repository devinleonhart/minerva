import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestIngredient, createTestRecipe } from '../setup.js'

const app = createTestApp()

describe('Ingredients Routes', () => {
  describe('GET /api/ingredients', () => {
    it('should return empty array when no ingredients exist', async () => {
      const response = await request(app)
        .get('/api/ingredients')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all ingredients ordered by name', async () => {
      await createTestIngredient({
        name: 'Zebra Ingredient',
        description: 'Description 1',
        secured: false
      })
      await createTestIngredient({
        name: 'Apple Ingredient',
        description: 'Description 2',
        secured: true
      })
      await createTestIngredient({
        name: 'Banana Ingredient',
        description: 'Description 3',
        secured: false
      })

      const response = await request(app)
        .get('/api/ingredients')
        .expect(200)

      expect(response.body).toHaveLength(3)
      // Verify ordering by name (ascending)
      expect(response.body[0].name).toBe('Apple Ingredient')
      expect(response.body[1].name).toBe('Banana Ingredient')
      expect(response.body[2].name).toBe('Zebra Ingredient')
    })
  })

  describe('GET /api/ingredients/:id', () => {
    it('should return specific ingredient by ID', async () => {
      const ingredient = await createTestIngredient({
        name: 'Test Ingredient',
        description: 'Test Description',
        secured: true
      })

      const response = await request(app)
        .get(`/api/ingredients/${ingredient.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: ingredient.id,
        name: 'Test Ingredient',
        description: 'Test Description',
        secured: true
      })
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
    })

    it('should return 400 for invalid ID (non-numeric)', async () => {
      const response = await request(app)
        .get('/api/ingredients/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid ingredient ID'
      })
    })

    it('should return 400 for invalid ID (negative number)', async () => {
      const response = await request(app)
        .get('/api/ingredients/-1')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid ingredient ID'
      })
    })

    it('should return 400 for invalid ID (zero)', async () => {
      const response = await request(app)
        .get('/api/ingredients/0')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid ingredient ID'
      })
    })

    it('should return 404 for non-existent ingredient', async () => {
      const response = await request(app)
        .get('/api/ingredients/99999')
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Ingredient not found'
      })
    })
  })

  describe('POST /api/ingredients', () => {
    it('should create new ingredient with all fields', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({
          name: 'New Ingredient',
          description: 'New Description',
          secured: true
        })
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'New Ingredient',
        description: 'New Description',
        secured: true
      })
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')

      // Verify it was actually created in the database
      const ingredient = await testPrisma.ingredient.findUnique({
        where: { id: response.body.id }
      })
      expect(ingredient).toBeTruthy()
      expect(ingredient?.name).toBe('New Ingredient')
    })

    it('should create ingredient with default secured value (false)', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({
          name: 'Unsecured Ingredient',
          description: 'Description'
        })
        .expect(201)

      expect(response.body.secured).toBe(false)
    })

    it('should create ingredient with secured explicitly set to false', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({
          name: 'Explicitly Unsecured',
          description: 'Description',
          secured: false
        })
        .expect(201)

      expect(response.body.secured).toBe(false)
    })

    it('should trim whitespace from name and description', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({
          name: '  Trimmed Ingredient  ',
          description: '  Trimmed Description  '
        })
        .expect(201)

      expect(response.body.name).toBe('Trimmed Ingredient')
      expect(response.body.description).toBe('Trimmed Description')
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({
          description: 'Description'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Ingredient name is required'
      })
    })

    it('should return 400 for empty name string', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({
          name: '',
          description: 'Description'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Ingredient name is required'
      })
    })

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({
          name: '   ',
          description: 'Description'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Ingredient name is required'
      })
    })

    it('should return 400 for non-string name', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({
          name: 123,
          description: 'Description'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Ingredient name is required'
      })
    })

    it('should return 400 for missing description', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({
          name: 'Test Ingredient'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Ingredient description is required'
      })
    })

    it('should return 400 for non-string description', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({
          name: 'Test Ingredient',
          description: 123
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Ingredient description is required'
      })
    })

    it('should return 400 for empty string description', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({
          name: 'Test Ingredient',
          description: ''
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Ingredient description is required'
      })
    })
  })

  describe('PUT /api/ingredients/:id', () => {
    let ingredient: Awaited<ReturnType<typeof createTestIngredient>>

    beforeEach(async () => {
      ingredient = await createTestIngredient({
        name: 'Original Name',
        description: 'Original Description',
        secured: false
      })
    })

    it('should update all fields', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          name: 'Updated Name',
          description: 'Updated Description',
          secured: true
        })
        .expect(200)

      expect(response.body).toMatchObject({
        id: ingredient.id,
        name: 'Updated Name',
        description: 'Updated Description',
        secured: true
      })

      // Verify in database
      const updated = await testPrisma.ingredient.findUnique({
        where: { id: ingredient.id }
      })
      expect(updated?.name).toBe('Updated Name')
      expect(updated?.description).toBe('Updated Description')
      expect(updated?.secured).toBe(true)
    })

    it('should update only name', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          name: 'New Name Only'
        })
        .expect(200)

      expect(response.body.name).toBe('New Name Only')
      expect(response.body.description).toBe('Original Description')
      expect(response.body.secured).toBe(false)
    })

    it('should update only description', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          description: 'New Description Only'
        })
        .expect(200)

      expect(response.body.name).toBe('Original Name')
      expect(response.body.description).toBe('New Description Only')
      expect(response.body.secured).toBe(false)
    })

    it('should update only secured flag', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          secured: true
        })
        .expect(200)

      expect(response.body.name).toBe('Original Name')
      expect(response.body.description).toBe('Original Description')
      expect(response.body.secured).toBe(true)
    })

    it('should trim whitespace from name when updating', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          name: '  Trimmed Name  '
        })
        .expect(200)

      expect(response.body.name).toBe('Trimmed Name')
    })

    it('should trim whitespace from description when updating', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          description: '  Trimmed Description  '
        })
        .expect(200)

      expect(response.body.description).toBe('Trimmed Description')
    })

    it('should return 400 when trying to set description to null', async () => {
      // The route handler now properly validates that description cannot be null
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          description: null
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Description must be a non-empty string'
      })
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/ingredients/abc')
        .send({
          name: 'Test'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid ingredient ID'
      })
    })

    it('should return 400 for empty name string', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          name: ''
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Ingredient name is required'
      })
    })

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          name: '   '
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Ingredient name is required'
      })
    })

    it('should return 400 for non-string name', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          name: 123
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Ingredient name is required'
      })
    })

    it('should return 400 for non-string description', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          description: 123
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Description must be a non-empty string'
      })
    })

    it('should return 400 for empty string description', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          description: ''
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Description must be a non-empty string'
      })
    })

    it('should return 400 for whitespace-only description', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          description: '   '
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Description must be a non-empty string'
      })
    })

    it('should return 400 for non-boolean secured', async () => {
      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({
          secured: 'true'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Secured must be a boolean'
      })
    })

    it('should return 404 for non-existent ingredient', async () => {
      const response = await request(app)
        .put('/api/ingredients/99999')
        .send({
          name: 'Test'
        })
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Ingredient not found'
      })
    })
  })

  describe('DELETE /api/ingredients/:id', () => {
    it('should delete ingredient successfully', async () => {
      const ingredient = await createTestIngredient({
        name: 'To Delete',
        description: 'Will be deleted'
      })

      await request(app)
        .delete(`/api/ingredients/${ingredient.id}`)
        .expect(204)

      // Verify it was deleted
      const deleted = await testPrisma.ingredient.findUnique({
        where: { id: ingredient.id }
      })
      expect(deleted).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/ingredients/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid ingredient ID'
      })
    })

    it('should return 404 for non-existent ingredient', async () => {
      const response = await request(app)
        .delete('/api/ingredients/99999')
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Ingredient not found'
      })
    })

    it('should return 400 when ingredient is used in recipes', async () => {
      const ingredient = await createTestIngredient({
        name: 'Used Ingredient',
        description: 'Used in recipe'
      })
      const recipe = await createTestRecipe({
        name: 'Test Recipe',
        description: 'Test'
      })

      // Create a recipe ingredient relationship
      await testPrisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          ingredientId: ingredient.id,
          quantity: 1
        }
      })

      const response = await request(app)
        .delete(`/api/ingredients/${ingredient.id}`)
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Cannot delete ingredient that is used in recipes',
        code: 'INGREDIENT_IN_USE'
      })

      // Verify ingredient still exists
      const stillExists = await testPrisma.ingredient.findUnique({
        where: { id: ingredient.id }
      })
      expect(stillExists).toBeTruthy()
    })

    it('should return 400 when ingredient has inventory items', async () => {
      const ingredient = await createTestIngredient({
        name: 'Inventory Ingredient',
        description: 'Has inventory'
      })

      // Create an inventory item
      await testPrisma.inventoryItem.create({
        data: {
          ingredientId: ingredient.id,
          quantity: 5,
          quality: 'NORMAL'
        }
      })

      const response = await request(app)
        .delete(`/api/ingredients/${ingredient.id}`)
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Cannot delete ingredient that has inventory items',
        code: 'INGREDIENT_IN_INVENTORY'
      })

      // Verify ingredient still exists
      const stillExists = await testPrisma.ingredient.findUnique({
        where: { id: ingredient.id }
      })
      expect(stillExists).toBeTruthy()
    })
  })

  describe('GET /api/ingredients/:id/deletable', () => {
    it('should return deletable: true for ingredient with no dependencies', async () => {
      const ingredient = await createTestIngredient({
        name: 'Deletable Ingredient',
        description: 'No dependencies'
      })

      const response = await request(app)
        .get(`/api/ingredients/${ingredient.id}/deletable`)
        .expect(200)

      expect(response.body).toMatchObject({
        canDelete: true,
        reason: null
      })
    })

    it('should return deletable: false when ingredient is used in recipes', async () => {
      const ingredient = await createTestIngredient({
        name: 'Recipe Ingredient',
        description: 'Used in recipe'
      })
      const recipe = await createTestRecipe({
        name: 'Test Recipe',
        description: 'Test'
      })

      await testPrisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          ingredientId: ingredient.id,
          quantity: 1
        }
      })

      const response = await request(app)
        .get(`/api/ingredients/${ingredient.id}/deletable`)
        .expect(200)

      expect(response.body).toMatchObject({
        canDelete: false,
        reason: 'Used in recipes'
      })
    })

    it('should return deletable: false when ingredient has inventory items', async () => {
      const ingredient = await createTestIngredient({
        name: 'Inventory Ingredient',
        description: 'Has inventory'
      })

      await testPrisma.inventoryItem.create({
        data: {
          ingredientId: ingredient.id,
          quantity: 3,
          quality: 'NORMAL'
        }
      })

      const response = await request(app)
        .get(`/api/ingredients/${ingredient.id}/deletable`)
        .expect(200)

      expect(response.body).toMatchObject({
        canDelete: false,
        reason: 'Has inventory items'
      })
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/ingredients/abc/deletable')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid ingredient ID'
      })
    })

    it('should return 200 even for non-existent ingredient (checks dependencies)', async () => {
      const response = await request(app)
        .get('/api/ingredients/99999/deletable')
        .expect(200)

      // The endpoint doesn't check if ingredient exists, just checks dependencies
      expect(response.body).toHaveProperty('canDelete')
    })
  })
})
