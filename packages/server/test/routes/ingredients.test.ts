import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestIngredient, createTestRecipe } from '../setup.js'

const app = createTestApp()

describe('Ingredients Routes', () => {
  beforeEach(async () => {
    await testPrisma.recipeIngredient.deleteMany()
    await testPrisma.inventoryItem.deleteMany()
    await testPrisma.ingredient.deleteMany()
    await testPrisma.recipe.deleteMany()
  })

  afterEach(async () => {
    await testPrisma.recipeIngredient.deleteMany()
    await testPrisma.inventoryItem.deleteMany()
    await testPrisma.ingredient.deleteMany()
    await testPrisma.recipe.deleteMany()
  })

  describe('GET /api/ingredients', () => {
    it('should return empty array when no ingredients exist', async () => {
      const response = await request(app)
        .get('/api/ingredients')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all ingredients', async () => {
      await createTestIngredient({ name: 'Dragon Scale', description: 'A rare dragon scale' })
      await createTestIngredient({ name: 'Common Herb', description: 'A common medicinal herb' })

      const response = await request(app)
        .get('/api/ingredients')
        .expect(200)

      expect(response.body).toHaveLength(2)
      expect(response.body[0]).toMatchObject({
        name: 'Dragon Scale',
        description: 'A rare dragon scale'
      })
      expect(response.body[1]).toMatchObject({
        name: 'Common Herb',
        description: 'A common medicinal herb'
      })
    })
  })

  describe('GET /api/ingredients/:id', () => {
    it('should return specific ingredient by ID', async () => {
      const ingredient = await createTestIngredient({
        name: 'Phoenix Feather',
        description: 'A rare feather from a phoenix'
      })

      const response = await request(app)
        .get(`/api/ingredients/${ingredient.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: ingredient.id,
        name: 'Phoenix Feather',
        description: 'A rare feather from a phoenix'
      })
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/ingredients/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid ingredient ID')
    })

    it('should return 404 for non-existent ingredient', async () => {
      const response = await request(app)
        .get('/api/ingredients/99999')
        .expect(404)

      expect(response.body.error).toBe('Ingredient not found')
    })
  })

  describe('POST /api/ingredients', () => {
    it('should create new ingredient', async () => {
      const ingredientData = {
        name: 'Moonstone Dust',
        description: 'Powdered moonstone with magical properties'
      }

      const response = await request(app)
        .post('/api/ingredients')
        .send(ingredientData)
        .expect(201)

      expect(response.body).toMatchObject(ingredientData)
      expect(response.body.id).toBeTruthy()
      expect(response.body.createdAt).toBeTruthy()
    })

    it('should create ingredient with minimal data', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({ name: 'Simple Herb', description: 'A simple herb' })
        .expect(201)

      expect(response.body.name).toBe('Simple Herb')
      expect(response.body.description).toBe('A simple herb')
      expect(response.body.id).toBeTruthy()
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({ description: 'No name provided' })
        .expect(400)

      expect(response.body.error).toBe('Ingredient name is required')
    })

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({ name: '' })
        .expect(400)

      expect(response.body.error).toBe('Ingredient name is required')
    })

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .post('/api/ingredients')
        .send({ name: '   ' })
        .expect(400)

      expect(response.body.error).toBe('Ingredient name is required')
    })
  })

  describe('PUT /api/ingredients/:id', () => {
    it('should update ingredient successfully', async () => {
      const ingredient = await createTestIngredient({
        name: 'Original Name',
        description: 'Original description'
      })

      const updateData = {
        name: 'Updated Name',
        description: 'Updated description'
      }

      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject(updateData)
      expect(response.body.id).toBe(ingredient.id)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/ingredients/invalid')
        .send({ name: 'Updated' })
        .expect(400)

      expect(response.body.error).toBe('Invalid ingredient ID')
    })

    it('should return 404 for non-existent ingredient', async () => {
      const response = await request(app)
        .put('/api/ingredients/99999')
        .send({ name: 'Updated' })
        .expect(404)

      expect(response.body.error).toBe('Ingredient not found')
    })

    it('should return 400 for missing name', async () => {
      const ingredient = await createTestIngredient({ name: 'Test Ingredient' })

      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({ name: '' })
        .expect(400)

      expect(response.body.error).toBe('Ingredient name is required')
    })

    it('should update secured field successfully', async () => {
      const ingredient = await createTestIngredient({
        name: 'Test Ingredient',
        description: 'Test description'
      })

      const updateData = {
        secured: true
      }

      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send(updateData)
        .expect(200)

      expect(response.body.secured).toBe(true)
      expect(response.body.id).toBe(ingredient.id)
    })

    it('should toggle secured field from true to false', async () => {
      const ingredient = await createTestIngredient({
        name: 'Secured Ingredient',
        description: 'Test description',
        secured: true
      })

      const updateData = {
        secured: false
      }

      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send(updateData)
        .expect(200)

      expect(response.body.secured).toBe(false)
      expect(response.body.id).toBe(ingredient.id)
    })

    it('should return 400 for invalid secured type', async () => {
      const ingredient = await createTestIngredient({ name: 'Test Ingredient' })

      const response = await request(app)
        .put(`/api/ingredients/${ingredient.id}`)
        .send({ secured: 'invalid' })
        .expect(400)

      expect(response.body.error).toBe('Secured must be a boolean')
    })
  })

  describe('DELETE /api/ingredients/:id', () => {
    it('should delete ingredient successfully when no dependencies exist', async () => {
      const ingredient = await createTestIngredient({ name: 'To Delete' })

      await request(app)
        .delete(`/api/ingredients/${ingredient.id}`)
        .expect(204)

      // Verify ingredient is deleted
      const getResponse = await request(app)
        .get(`/api/ingredients/${ingredient.id}`)
        .expect(404)

      expect(getResponse.body.error).toBe('Ingredient not found')
    })

    it('should prevent deletion when ingredient is used in recipes', async () => {
      const ingredient = await createTestIngredient({ name: 'Essential Herb' })
      const recipe = await createTestRecipe({ name: 'Test Recipe' })

      // Create recipe-ingredient relationship
      await testPrisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          ingredientId: ingredient.id,
          quantity: 2
        }
      })

      const response = await request(app)
        .delete(`/api/ingredients/${ingredient.id}`)
        .expect(400)

      expect(response.body.error).toBe('Cannot delete ingredient that is used in recipes')
      expect(response.body.code).toBe('INGREDIENT_IN_USE')
    })

    it('should prevent deletion when ingredient has inventory items', async () => {
      const ingredient = await createTestIngredient({ name: 'Stocked Herb' })

      // Create inventory item for this ingredient
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

      expect(response.body.error).toBe('Cannot delete ingredient that has inventory items')
      expect(response.body.code).toBe('INGREDIENT_IN_INVENTORY')
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/ingredients/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid ingredient ID')
    })

    it('should return 404 for non-existent ingredient', async () => {
      const response = await request(app)
        .delete('/api/ingredients/99999')
        .expect(404)

      expect(response.body.error).toBe('Ingredient not found')
    })
  })

  describe('GET /api/ingredients/:id/deletable', () => {
    it('should return deletable when ingredient has no dependencies', async () => {
      const ingredient = await createTestIngredient({ name: 'Unused Herb' })

      const response = await request(app)
        .get(`/api/ingredients/${ingredient.id}/deletable`)
        .expect(200)

      expect(response.body.canDelete).toBe(true)
      expect(response.body.reason).toBeNull()
    })

    it('should return not deletable when ingredient is used in recipes', async () => {
      const ingredient = await createTestIngredient({ name: 'Essential Herb' })
      const recipe = await createTestRecipe({ name: 'Test Recipe' })

      await testPrisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          ingredientId: ingredient.id,
          quantity: 2
        }
      })

      const response = await request(app)
        .get(`/api/ingredients/${ingredient.id}/deletable`)
        .expect(200)

      expect(response.body.canDelete).toBe(false)
      expect(response.body.reason).toBe('Used in recipes')
    })

    it('should return not deletable when ingredient has inventory items', async () => {
      const ingredient = await createTestIngredient({ name: 'Stocked Herb' })

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

      expect(response.body.canDelete).toBe(false)
      expect(response.body.reason).toBe('Has inventory items')
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/ingredients/invalid/deletable')
        .expect(400)

      expect(response.body.error).toBe('Invalid ingredient ID')
    })
  })
})
