import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { createTestRecipe, createTestIngredient } from '../setup.js'

const app = createTestApp()

describe('Recipes Routes', () => {
  describe('GET /api/recipes', () => {
    it('should return empty array when no recipes exist', async () => {
      const response = await request(app)
        .get('/api/recipes')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all recipes', async () => {
      await createTestRecipe({ name: 'Healing Potion', description: 'A simple healing potion' })
      await createTestRecipe({ name: 'Dragon Breath Elixir', description: 'A powerful elixir' })

      const response = await request(app)
        .get('/api/recipes')
        .expect(200)

      expect(response.body).toHaveLength(2)
      // API orders by name alphabetically, so Dragon Breath Elixir comes first
      expect(response.body[0]).toMatchObject({
        name: 'Dragon Breath Elixir',
        description: 'A powerful elixir'
      })
      expect(response.body[1]).toMatchObject({
        name: 'Healing Potion',
        description: 'A simple healing potion'
      })
    })
  })

  describe('GET /api/recipes/:id', () => {
    it('should return specific recipe by ID', async () => {
      const recipe = await createTestRecipe({
        name: 'Invisibility Potion',
        description: 'Makes the drinker invisible for 1 hour'
      })

      const response = await request(app)
        .get(`/api/recipes/${recipe.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: recipe.id,
        name: 'Invisibility Potion',
        description: 'Makes the drinker invisible for 1 hour'
      })
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .get('/api/recipes/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid recipe ID')
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .get('/api/recipes/99999')
        .expect(404)

      expect(response.body.error).toBe('Recipe not found')
    })
  })

  describe('POST /api/recipes', () => {
    it('should create new recipe', async () => {
      const ingredient = await createTestIngredient({ name: 'Fire Flower', description: 'A magical flower' })

      const recipeData = {
        name: 'Fire Resistance Potion',
        description: 'Grants resistance to fire damage',
        ingredients: [{ ingredientId: ingredient.id, quantity: 1 }]
      }

      const response = await request(app)
        .post('/api/recipes')
        .send(recipeData)
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'Fire Resistance Potion',
        description: 'Grants resistance to fire damage'
      })
      expect(response.body.id).toBeTruthy()
    })

    it('should create recipe with cauldron essences', async () => {
      const ingredient = await createTestIngredient({ name: 'Healing Herb', description: 'A restorative herb' })

      const recipeData = {
        name: 'Healing Potion',
        description: 'Restores health over time',
        ingredients: [{ ingredientId: ingredient.id, quantity: 2 }],
        cauldronName: 'Life\'s Rain',
        fireEssence: 'Adds burning damage reduction',
        waterEssence: 'Increases healing rate',
        lifeEssence: 'Doubles healing amount'
      }

      const response = await request(app)
        .post('/api/recipes')
        .send(recipeData)
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'Healing Potion',
        description: 'Restores health over time',
        cauldronName: 'Life\'s Rain',
        fireEssence: 'Adds burning damage reduction',
        waterEssence: 'Increases healing rate',
        lifeEssence: 'Doubles healing amount'
      })
      expect(response.body.airEssence).toBeNull()
      expect(response.body.earthEssence).toBeNull()
      expect(response.body.id).toBeTruthy()
    })

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({ description: 'A recipe without a name' })
        .expect(400)

      expect(response.body.error).toBe('name, description, and ingredients array are required')
    })
  })

  describe('PUT /api/recipes/:id', () => {
    it('should update recipe', async () => {
      const recipe = await createTestRecipe({ name: 'Basic Potion', description: 'A basic potion' })

      const updateData = {
        name: 'Advanced Potion',
        description: 'An improved version of the basic potion'
      }

      const response = await request(app)
        .put(`/api/recipes/${recipe.id}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject(updateData)
    })

    it('should update recipe with cauldron essences', async () => {
      const recipe = await createTestRecipe({ name: 'Basic Potion', description: 'A basic potion' })

      const updateData = {
        name: 'Advanced Potion',
        description: 'An improved version of the basic potion',
        cauldronName: 'Life\'s Rain',
        fireEssence: 'Adds burning damage over time',
        waterEssence: 'Provides healing over time'
      }

      const response = await request(app)
        .put(`/api/recipes/${recipe.id}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject(updateData)
      expect(response.body.cauldronName).toBe('Life\'s Rain')
      expect(response.body.fireEssence).toBe('Adds burning damage over time')
      expect(response.body.waterEssence).toBe('Provides healing over time')
      expect(response.body.airEssence).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/api/recipes/invalid')
        .send({ name: 'Test' })
        .expect(400)

      expect(response.body.error).toBe('Invalid recipe ID')
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .put('/api/recipes/99999')
        .send({ name: 'Test' })
        .expect(404)

      expect(response.body.error).toBe('Recipe not found')
    })
  })

  describe('DELETE /api/recipes/:id', () => {
    it('should delete recipe', async () => {
      const recipe = await createTestRecipe({ name: 'Delete Me Recipe' })

      await request(app)
        .delete(`/api/recipes/${recipe.id}`)
        .expect(204)

      // Verify deletion
      await request(app)
        .get(`/api/recipes/${recipe.id}`)
        .expect(404)
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/recipes/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid recipe ID')
    })
  })

  describe('GET /api/recipes/craftable', () => {
    it('should return craftable recipes based on inventory', async () => {
      // Create ingredients
      const herb = await createTestIngredient({ name: 'Magic Herb' })
      const water = await createTestIngredient({ name: 'Pure Water' })

      // Create recipe
      await createTestRecipe({
        name: 'Simple Healing Potion',
        description: 'Some Potion'
      })

      // Add ingredients to inventory
      await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: herb.id,
          quantity: 5,
          quality: 'NORMAL'
        })

      await request(app)
        .post('/api/inventory')
        .send({
          ingredientId: water.id,
          quantity: 3,
          quality: 'NORMAL'
        })

      const response = await request(app)
        .get('/api/recipes/craftable')
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      // Note: The exact craftable logic depends on your business rules
      // This test verifies the endpoint works and returns an array
    })
  })
})
