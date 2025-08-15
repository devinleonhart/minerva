import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestRecipe, createTestIngredient } from '../setup.js'

const app = createTestApp()

describe('Potions Routes', () => {
  describe('GET /api/potions', () => {
    it('should return empty array when no potions exist', async () => {
      const response = await request(app)
        .get('/api/potions')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all potions with recipe data', async () => {
      // Create recipes first
      const healingRecipe = await createTestRecipe({
        name: 'Healing Potion Recipe'
      })

      const manaRecipe = await createTestRecipe({
        name: 'Mana Potion Recipe'
      })

      // Create potions
      const healingPotion = await testPrisma.potion.create({
        data: {
          recipeId: healingRecipe.id,
          quality: 'NORMAL'
        }
      })

      const manaPotion = await testPrisma.potion.create({
        data: {
          recipeId: manaRecipe.id,
          quality: 'HQ'
        }
      })

      const response = await request(app)
        .get('/api/potions')
        .expect(200)

      expect(response.body).toHaveLength(2)

      // API returns potions ordered by id DESC, so mana potion (created second) comes first
      expect(response.body[0]).toMatchObject({
        id: manaPotion.id,
        quality: 'HQ'
      })
      expect(response.body[0].recipe).toMatchObject({
        id: manaRecipe.id,
        name: 'Mana Potion Recipe'
      })

      // Healing potion (created first) comes second
      expect(response.body[1]).toMatchObject({
        id: healingPotion.id,
        quality: 'NORMAL'
      })
      expect(response.body[1].recipe).toMatchObject({
        id: healingRecipe.id,
        name: 'Healing Potion Recipe'
      })
    })

    it('should handle potions with missing recipes gracefully', async () => {
      // Create potion with non-existent recipe ID
      const orphanedPotion = await testPrisma.potion.create({
        data: {
          recipeId: 99999, // Non-existent recipe
          quality: 'NORMAL'
        }
      })

      const response = await request(app)
        .get('/api/potions')
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0]).toMatchObject({
        id: orphanedPotion.id,
        quality: 'NORMAL'
      })
      expect(response.body[0].recipe).toBeNull()
    })
  })

  describe('POST /api/potions', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/potions')
        .send({})
        .expect(400)

      expect(response.body.error).toBe('recipeId and ingredientSelections array are required')
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: 99999,
          ingredientSelections: []
        })
        .expect(404)

      expect(response.body.error).toBe('Recipe not found')
    })

    it('should create potion with specified quality', async () => {
      // Create a test ingredient first
      const ingredient = await createTestIngredient({
        name: 'Test Ingredient'
      })

      // Create a recipe with ingredients
      const recipe = await createTestRecipe({
        name: 'Test Recipe'
      })

      // Add ingredient to recipe
      await testPrisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          ingredientId: ingredient.id,
          quantity: 1
        }
      })

      // Create inventory item
      const inventoryItem = await testPrisma.inventoryItem.create({
        data: {
          ingredientId: ingredient.id,
          quantity: 5,
          quality: 'NORMAL'
        }
      })

      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          quality: 'HQ',
          ingredientSelections: [
            {
              ingredientId: ingredient.id,
              inventoryItemId: inventoryItem.id,
              quantity: 1
            }
          ]
        })
        .expect(201)

      expect(response.body.quality).toBe('HQ')
      expect(response.body.recipeId).toBe(recipe.id)
    })
  })

  describe('POST /api/potions/direct', () => {
    it('should create potion directly without ingredient requirements', async () => {
      const recipe = await createTestRecipe({
        name: 'Test Potion',
        description: 'A test potion for direct creation'
      })

      const response = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id,
          quality: 'HQ'
        })
        .expect(201)

      expect(response.body).toMatchObject({
        recipeId: recipe.id,
        quality: 'HQ'
      })
      expect(response.body.id).toBeTruthy()
      expect(response.body.inventoryItems).toBeDefined()
      expect(response.body.inventoryItems).toHaveLength(1)
      expect(response.body.inventoryItems[0].quantity).toBe(1)
    })

    it('should default to NORMAL quality when not specified', async () => {
      const recipe = await createTestRecipe({
        name: 'Default Quality Potion',
        description: 'A potion with default quality'
      })

      const response = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id
        })
        .expect(201)

      expect(response.body.quality).toBe('NORMAL')
    })

    it('should return 400 when recipeId is missing', async () => {
      const response = await request(app)
        .post('/api/potions/direct')
        .send({
          quality: 'HQ'
        })
        .expect(400)

      expect(response.body.error).toBe('recipeId is required')
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: 99999,
          quality: 'HQ'
        })
        .expect(404)

      expect(response.body.error).toBe('Recipe not found')
    })
  })
})
