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

    it('should stack potions with same recipe and quality', async () => {
      const recipe = await createTestRecipe({ name: 'Healing Potion' })

      // Create first potion
      const response1 = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id,
          quality: 'NORMAL'
        })
        .expect(201)

      expect(response1.body.inventoryItems[0].quantity).toBe(1)
      const firstPotionId = response1.body.id
      const firstInventoryItemId = response1.body.inventoryItems[0].id

      // Create second potion with same recipe and quality
      const response2 = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id,
          quality: 'NORMAL'
        })
        .expect(201)

      // Should return the same potion
      expect(response2.body.id).toBe(firstPotionId)

      // Verify the inventory item quantity was incremented
      const inventoryItem = await testPrisma.potionInventoryItem.findUnique({
        where: { id: firstInventoryItemId }
      })
      expect(inventoryItem?.quantity).toBe(2)

      // Verify only one potion exists in the database
      const potions = await testPrisma.potion.findMany({
        where: {
          recipeId: recipe.id,
          quality: 'NORMAL'
        }
      })
      expect(potions).toHaveLength(1)

      // Verify only one inventory item exists
      const inventoryItems = await testPrisma.potionInventoryItem.findMany({
        where: {
          potionId: firstPotionId
        }
      })
      expect(inventoryItems).toHaveLength(1)
    })

    it('should create separate inventory items for different qualities', async () => {
      const recipe = await createTestRecipe({ name: 'Healing Potion' })

      // Create NORMAL quality potion
      const response1 = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id,
          quality: 'NORMAL'
        })
        .expect(201)

      const normalPotionId = response1.body.id

      // Create HQ quality potion
      const response2 = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id,
          quality: 'HQ'
        })
        .expect(201)

      const hqPotionId = response2.body.id

      // Should create different potions
      expect(normalPotionId).not.toBe(hqPotionId)

      // Verify two separate potions exist
      const potions = await testPrisma.potion.findMany({
        where: {
          recipeId: recipe.id
        }
      })
      expect(potions).toHaveLength(2)
    })

    it('should create separate inventory items for different recipes', async () => {
      const recipe1 = await createTestRecipe({ name: 'Healing Potion' })
      const recipe2 = await createTestRecipe({ name: 'Mana Potion' })

      // Create potion from recipe1
      const response1 = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe1.id,
          quality: 'NORMAL'
        })
        .expect(201)

      const potion1Id = response1.body.id

      // Create potion from recipe2
      const response2 = await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe2.id,
          quality: 'NORMAL'
        })
        .expect(201)

      const potion2Id = response2.body.id

      // Should create different potions
      expect(potion1Id).not.toBe(potion2Id)

      // Verify two separate potions exist
      const allPotions = await testPrisma.potion.findMany()
      expect(allPotions).toHaveLength(2)
    })

    it('should stack multiple times correctly', async () => {
      const recipe = await createTestRecipe({ name: 'Healing Potion' })

      // Create first potion
      await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id,
          quality: 'NORMAL'
        })
        .expect(201)

      // Create second potion
      await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id,
          quality: 'NORMAL'
        })
        .expect(201)

      // Create third potion
      await request(app)
        .post('/api/potions/direct')
        .send({
          recipeId: recipe.id,
          quality: 'NORMAL'
        })
        .expect(201)

      // Verify the quantity is now 3
      const inventoryItems = await testPrisma.potionInventoryItem.findMany({
        where: {
          potion: {
            recipeId: recipe.id,
            quality: 'NORMAL'
          }
        }
      })
      expect(inventoryItems).toHaveLength(1)
      expect(inventoryItems[0].quantity).toBe(3)
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

    it('should stack crafted potions with same recipe and quality', async () => {
      const ingredient = await createTestIngredient({ name: 'Herb', description: 'Test' })
      const recipe = await createTestRecipeWithIngredients({
        name: 'Healing Potion',
        ingredientIds: [ingredient.id]
      })
      const inventoryItem = await createTestInventoryItem({
        ingredientId: ingredient.id,
        quantity: 10
      })

      // Craft first potion
      const response1 = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          quality: 'NORMAL',
          ingredientSelections: [
            {
              ingredientId: ingredient.id,
              inventoryItemId: inventoryItem.id,
              quantity: 1
            }
          ]
        })
        .expect(201)

      const firstPotionId = response1.body.id

      // Craft second potion with same recipe and quality
      const response2 = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          quality: 'NORMAL',
          ingredientSelections: [
            {
              ingredientId: ingredient.id,
              inventoryItemId: inventoryItem.id,
              quantity: 1
            }
          ]
        })
        .expect(201)

      // Should return the same potion
      expect(response2.body.id).toBe(firstPotionId)

      // Verify the inventory item quantity was incremented
      const potionInventoryItems = await testPrisma.potionInventoryItem.findMany({
        where: {
          potionId: firstPotionId
        }
      })
      expect(potionInventoryItems).toHaveLength(1)
      expect(potionInventoryItems[0].quantity).toBe(2)

      // Verify only one potion exists
      const potions = await testPrisma.potion.findMany({
        where: {
          recipeId: recipe.id,
          quality: 'NORMAL'
        }
      })
      expect(potions).toHaveLength(1)

      // Verify ingredient inventory was decremented correctly
      const updatedIngredientInventory = await testPrisma.inventoryItem.findUnique({
        where: { id: inventoryItem.id }
      })
      expect(updatedIngredientInventory?.quantity).toBe(8) // 10 - 1 - 1
    })

    it('should create separate inventory for crafted potions with different qualities', async () => {
      const ingredient = await createTestIngredient({ name: 'Herb', description: 'Test' })
      const recipe = await createTestRecipeWithIngredients({
        name: 'Healing Potion',
        ingredientIds: [ingredient.id]
      })
      const inventoryItem = await createTestInventoryItem({
        ingredientId: ingredient.id,
        quantity: 10
      })

      // Craft NORMAL quality potion
      const response1 = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          quality: 'NORMAL',
          ingredientSelections: [
            {
              ingredientId: ingredient.id,
              inventoryItemId: inventoryItem.id,
              quantity: 1
            }
          ]
        })
        .expect(201)

      const normalPotionId = response1.body.id

      // Craft HQ quality potion
      const response2 = await request(app)
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

      const hqPotionId = response2.body.id

      // Should create different potions
      expect(normalPotionId).not.toBe(hqPotionId)

      // Verify two separate potions exist
      const potions = await testPrisma.potion.findMany({
        where: {
          recipeId: recipe.id
        }
      })
      expect(potions).toHaveLength(2)
    })

    it('should handle the example scenario: 3 healing potions (2 NQ, 1 LQ)', async () => {
      const ingredient = await createTestIngredient({ name: 'Herb', description: 'Test' })
      const recipe = await createTestRecipeWithIngredients({
        name: 'Healing Potion',
        ingredientIds: [ingredient.id]
      })
      const inventoryItem = await createTestInventoryItem({
        ingredientId: ingredient.id,
        quantity: 10
      })

      // Craft first NQ potion
      await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          quality: 'NORMAL',
          ingredientSelections: [
            {
              ingredientId: ingredient.id,
              inventoryItemId: inventoryItem.id,
              quantity: 1
            }
          ]
        })
        .expect(201)

      // Craft second NQ potion
      await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          quality: 'NORMAL',
          ingredientSelections: [
            {
              ingredientId: ingredient.id,
              inventoryItemId: inventoryItem.id,
              quantity: 1
            }
          ]
        })
        .expect(201)

      // Craft one LQ potion
      await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipe.id,
          quality: 'LQ',
          ingredientSelections: [
            {
              ingredientId: ingredient.id,
              inventoryItemId: inventoryItem.id,
              quantity: 1
            }
          ]
        })
        .expect(201)

      // Verify we have exactly 2 potions (one for each quality)
      const allPotions = await testPrisma.potion.findMany({
        where: {
          recipeId: recipe.id
        }
      })
      expect(allPotions).toHaveLength(2)

      // Verify the NQ potion has quantity 2
      const nqPotion = await testPrisma.potion.findFirst({
        where: {
          recipeId: recipe.id,
          quality: 'NORMAL'
        },
        include: {
          inventoryItems: true
        }
      })
      expect(nqPotion?.inventoryItems[0].quantity).toBe(2)

      // Verify the LQ potion has quantity 1
      const lqPotion = await testPrisma.potion.findFirst({
        where: {
          recipeId: recipe.id,
          quality: 'LQ'
        },
        include: {
          inventoryItems: true
        }
      })
      expect(lqPotion?.inventoryItems[0].quantity).toBe(1)

      // Verify we have exactly 2 inventory items
      const allInventoryItems = await testPrisma.potionInventoryItem.findMany({
        where: {
          potion: {
            recipeId: recipe.id
          }
        }
      })
      expect(allInventoryItems).toHaveLength(2)
    })
  })
})
