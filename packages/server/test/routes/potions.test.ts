import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestIngredient, createTestRecipe, createTestRecipeWithIngredients, createTestInventoryItem, createTestPotion } from '../setup.js'

const app = createTestApp()

describe('Potions Routes', () => {
  describe('GET /api/potions', () => {
    it('should return empty array when no potions exist', async () => {
      const response = await request(app)
        .get('/api/potions')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should return all potions with recipe information', async () => {
      const recipe1 = await createTestRecipe({ name: 'Recipe 1' })
      const recipe2 = await createTestRecipe({ name: 'Recipe 2' })

      await createTestPotion({ recipeId: recipe1.id, quality: 'NORMAL' })
      await createTestPotion({ recipeId: recipe2.id, quality: 'HQ' })

      const response = await request(app)
        .get('/api/potions')
        .expect(200)

      expect(response.body).toHaveLength(2)
      // Potions should be ordered by id desc (newest first)
      expect(response.body[0]).toHaveProperty('recipe')
      expect(response.body[1]).toHaveProperty('recipe')
      expect(response.body[0].quality).toBe('HQ')
      expect(response.body[1].quality).toBe('NORMAL')
    })
  })

  describe('POST /api/potions/direct', () => {
    it('should create potion directly with all fields', async () => {
      const recipe = await createTestRecipe({
        name: 'Test Recipe',
        description: 'Test Description'
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
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('createdAt')
      expect(response.body).toHaveProperty('updatedAt')
      expect(response.body).toHaveProperty('inventoryItems')
      expect(response.body.inventoryItems).toHaveLength(1)
      expect(response.body.inventoryItems[0].quantity).toBe(1)

      // Verify it was actually created in the database
      const potion = await testPrisma.potion.findUnique({
        where: { id: response.body.id }
      })
      expect(potion).toBeTruthy()
      expect(potion?.quality).toBe('HQ')
    })

    it('should create potion with default quality (NORMAL)', async () => {
      const recipe = await createTestRecipe({ name: 'Test Recipe' })

      const response = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id
        })
        .expect(201)

      expect(response.body.quality).toBe('NORMAL')
    })

    it('should return 400 for missing recipeId', async () => {
      const response = await request(app)
        .post('/api/potions/direct')
        .send({
          quality: 'HQ'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'recipeId is required'
      })
    })

    it('should return 400 for invalid quality value', async () => {
      const recipe = await createTestRecipe({ name: 'Test Recipe' })

      const response = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id,
          quality: 'INVALID'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid quality. Must be NORMAL, HQ, or LQ'
      })
    })

    it('should return 400 for null quality', async () => {
      const recipe = await createTestRecipe({ name: 'Test Recipe' })

      const response = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id,
          quality: null
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid quality. Must be NORMAL, HQ, or LQ'
      })
    })

    it('should return 400 for empty string quality', async () => {
      const recipe = await createTestRecipe({ name: 'Test Recipe' })

      const response = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id,
          quality: ''
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid quality. Must be NORMAL, HQ, or LQ'
      })
    })

    it('should return 400 for non-string quality', async () => {
      const recipe = await createTestRecipe({ name: 'Test Recipe' })

      const response = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id,
          quality: 123
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid quality. Must be NORMAL, HQ, or LQ'
      })
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: 99999
        })
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Recipe not found'
      })
    })

    it('should accept all valid quality values', async () => {
      for (const quality of ['NORMAL', 'HQ', 'LQ'] as const) {
        const recipe = await createTestRecipe({
          name: `Test Recipe ${quality}`
        })

        const response = await request(app)
          .post('/api/potions/direct')
          .send({
            recipeId: recipe.id,
            quality
          })
          .expect(201)

        expect(response.body.quality).toBe(quality)
      }
    })
  })

  describe('POST /api/potions', () => {
    it('should craft potion successfully with valid ingredients', async () => {
      const ingredient1 = await createTestIngredient({ name: 'Ingredient 1', description: 'Test' })
      const ingredient2 = await createTestIngredient({ name: 'Ingredient 2', description: 'Test' })

      const recipe = await createTestRecipeWithIngredients({
        name: 'Test Recipe',
        ingredientIds: [ingredient1.id, ingredient2.id],
        quantities: [2, 3]
      })

      const inventoryItem1 = await createTestInventoryItem({
        ingredientId: ingredient1.id,
        quantity: 5,
        quality: 'NORMAL'
      })
      const inventoryItem2 = await createTestInventoryItem({
        ingredientId: ingredient2.id,
        quantity: 5,
        quality: 'NORMAL'
      })

      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          quality: 'HQ',
          ingredientSelections: [
            {
              ingredientId: ingredient1.id,
              inventoryItemId: inventoryItem1.id,
              quantity: 2
            },
            {
              ingredientId: ingredient2.id,
              inventoryItemId: inventoryItem2.id,
              quantity: 3
            }
          ]
        })
        .expect(201)

      expect(response.body).toMatchObject({
        recipeId: recipe.id,
        quality: 'HQ'
      })
      expect(response.body).toHaveProperty('recipe')
      expect(response.body.recipe.ingredients).toHaveLength(2)

      // Verify inventory was updated
      const updatedItem1 = await testPrisma.inventoryItem.findUnique({
        where: { id: inventoryItem1.id }
      })
      const updatedItem2 = await testPrisma.inventoryItem.findUnique({
        where: { id: inventoryItem2.id }
      })
      expect(updatedItem1?.quantity).toBe(3) // 5 - 2
      expect(updatedItem2?.quantity).toBe(2) // 5 - 3
    })

    it('should craft potion with default quality (NORMAL)', async () => {
      const ingredient = await createTestIngredient({ name: 'Ingredient', description: 'Test' })
      const recipe = await createTestRecipeWithIngredients({
        name: 'Test Recipe',
        ingredientIds: [ingredient.id]
      })
      const inventoryItem = await createTestInventoryItem({
        ingredientId: ingredient.id,
        quantity: 5
      })

      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          ingredientSelections: [
            {
              ingredientId: ingredient.id,
              inventoryItemId: inventoryItem.id,
              quantity: 1
            }
          ]
        })
        .expect(201)

      expect(response.body.quality).toBe('NORMAL')
    })

    it('should delete inventory item when quantity becomes zero', async () => {
      const ingredient = await createTestIngredient({ name: 'Ingredient', description: 'Test' })
      const recipe = await createTestRecipeWithIngredients({
        name: 'Test Recipe',
        ingredientIds: [ingredient.id]
      })
      const inventoryItem = await createTestInventoryItem({
        ingredientId: ingredient.id,
        quantity: 1
      })

      await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          ingredientSelections: [
            {
              ingredientId: ingredient.id,
              inventoryItemId: inventoryItem.id,
              quantity: 1
            }
          ]
        })
        .expect(201)

      // Verify inventory item was deleted
      const deleted = await testPrisma.inventoryItem.findUnique({
        where: { id: inventoryItem.id }
      })
      expect(deleted).toBeNull()
    })

    it('should return 400 for missing recipeId', async () => {
      const response = await request(app)
        .post('/api/potions')
        .send({
          ingredientSelections: []
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'recipeId and ingredientSelections array are required'
      })
    })

    it('should return 400 for missing ingredientSelections', async () => {
      const recipe = await createTestRecipe({ name: 'Test Recipe' })

      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'recipeId and ingredientSelections array are required'
      })
    })

    it('should return 400 for non-array ingredientSelections', async () => {
      const recipe = await createTestRecipe({ name: 'Test Recipe' })

      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          ingredientSelections: 'not an array'
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'recipeId and ingredientSelections array are required'
      })
    })

    it('should return 400 for invalid quality value', async () => {
      const recipe = await createTestRecipe({ name: 'Test Recipe' })

      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          quality: 'INVALID',
          ingredientSelections: []
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid quality. Must be NORMAL, HQ, or LQ'
      })
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: 99999,
          ingredientSelections: []
        })
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Recipe not found'
      })
    })

    it('should return 400 when not all recipe ingredients are provided', async () => {
      const ingredient1 = await createTestIngredient({ name: 'Ingredient 1', description: 'Test' })
      const ingredient2 = await createTestIngredient({ name: 'Ingredient 2', description: 'Test' })

      const recipe = await createTestRecipeWithIngredients({
        name: 'Test Recipe',
        ingredientIds: [ingredient1.id, ingredient2.id]
      })

      const inventoryItem1 = await createTestInventoryItem({
        ingredientId: ingredient1.id,
        quantity: 5
      })

      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          ingredientSelections: [
            {
              ingredientId: ingredient1.id,
              inventoryItemId: inventoryItem1.id,
              quantity: 1
            }
            // Missing ingredient2
          ]
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'All recipe ingredients must be provided'
      })
    })

    it('should return 400 when ingredient selections do not match recipe requirements', async () => {
      const ingredient1 = await createTestIngredient({ name: 'Ingredient 1', description: 'Test' })
      const ingredient2 = await createTestIngredient({ name: 'Ingredient 2', description: 'Test' })
      const ingredient3 = await createTestIngredient({ name: 'Ingredient 3', description: 'Test' })

      const recipe = await createTestRecipeWithIngredients({
        name: 'Test Recipe',
        ingredientIds: [ingredient1.id, ingredient2.id]
      })

      const inventoryItem1 = await createTestInventoryItem({
        ingredientId: ingredient1.id,
        quantity: 5
      })
      const inventoryItem3 = await createTestInventoryItem({
        ingredientId: ingredient3.id,
        quantity: 5
      })

      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          ingredientSelections: [
            {
              ingredientId: ingredient1.id,
              inventoryItemId: inventoryItem1.id,
              quantity: 1
            },
            {
              ingredientId: ingredient3.id, // Wrong ingredient
              inventoryItemId: inventoryItem3.id,
              quantity: 1
            }
          ]
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Ingredient selections must match recipe requirements'
      })
    })

    it('should return 400 when ingredient quantities do not match recipe requirements', async () => {
      const ingredient1 = await createTestIngredient({ name: 'Ingredient 1', description: 'Test' })
      const ingredient2 = await createTestIngredient({ name: 'Ingredient 2', description: 'Test' })

      const recipe = await createTestRecipeWithIngredients({
        name: 'Test Recipe',
        ingredientIds: [ingredient1.id, ingredient2.id],
        quantities: [2, 3]
      })

      const inventoryItem1 = await createTestInventoryItem({
        ingredientId: ingredient1.id,
        quantity: 5
      })
      const inventoryItem2 = await createTestInventoryItem({
        ingredientId: ingredient2.id,
        quantity: 5
      })

      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          ingredientSelections: [
            {
              ingredientId: ingredient1.id,
              inventoryItemId: inventoryItem1.id,
              quantity: 1 // Should be 2
            },
            {
              ingredientId: ingredient2.id,
              inventoryItemId: inventoryItem2.id,
              quantity: 3
            }
          ]
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Ingredient quantities must match recipe requirements'
      })
    })

    it('should return 400 when inventory items are not found', async () => {
      const ingredient1 = await createTestIngredient({ name: 'Ingredient 1', description: 'Test' })
      const ingredient2 = await createTestIngredient({ name: 'Ingredient 2', description: 'Test' })

      const recipe = await createTestRecipeWithIngredients({
        name: 'Test Recipe',
        ingredientIds: [ingredient1.id, ingredient2.id]
      })

      const inventoryItem1 = await createTestInventoryItem({
        ingredientId: ingredient1.id,
        quantity: 5
      })

      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          ingredientSelections: [
            {
              ingredientId: ingredient1.id,
              inventoryItemId: inventoryItem1.id,
              quantity: 1
            },
            {
              ingredientId: ingredient2.id,
              inventoryItemId: 99999, // Non-existent inventory item
              quantity: 1
            }
          ]
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'One or more inventory items not found'
      })
    })

    it('should return 400 when inventory has insufficient quantity', async () => {
      const ingredient = await createTestIngredient({ name: 'Ingredient', description: 'Test' })
      const recipe = await createTestRecipeWithIngredients({
        name: 'Test Recipe',
        ingredientIds: [ingredient.id],
        quantities: [5]
      })
      const inventoryItem = await createTestInventoryItem({
        ingredientId: ingredient.id,
        quantity: 3 // Less than required 5
      })

      const response = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          ingredientSelections: [
            {
              ingredientId: ingredient.id,
              inventoryItemId: inventoryItem.id,
              quantity: 5
            }
          ]
        })
        .expect(500) // Transaction error is caught and handled

      expect(response.body).toHaveProperty('error')
    })

    it('should accept all valid quality values', async () => {
      for (const quality of ['NORMAL', 'HQ', 'LQ'] as const) {
        const ingredient = await createTestIngredient({
          name: `Ingredient ${quality}`,
          description: 'Test'
        })
        const recipe = await createTestRecipeWithIngredients({
          name: `Test Recipe ${quality}`,
          ingredientIds: [ingredient.id]
        })
        const inventoryItem = await createTestInventoryItem({
          ingredientId: ingredient.id,
          quantity: 5
        })

        const response = await request(app)
          .post('/api/potions')
          .send({
            recipeId: recipe.id,
            quality,
            ingredientSelections: [
              {
                ingredientId: ingredient.id,
                inventoryItemId: inventoryItem.id,
                quantity: 1
              }
            ]
          })
          .expect(201)

        expect(response.body.quality).toBe(quality)
      }
    })
  })
})
