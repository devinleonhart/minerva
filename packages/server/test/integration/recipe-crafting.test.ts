import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestIngredient, createTestRecipe } from '../setup.js'

const app = createTestApp()

describe('Recipe Crafting Integration Tests', () => {
  describe('Recipe Creation with Ingredients', () => {
    it('should create recipe with multiple ingredients', async () => {
      // Create ingredients
      const herb1 = await createTestIngredient({ name: 'Healing Herb' })
      const herb2 = await createTestIngredient({ name: 'Mana Crystal' })
      const herb3 = await createTestIngredient({ name: 'Spring Water' })

      const recipeData = {
        name: 'Master Healing Potion',
        description: 'A powerful healing potion',
        ingredients: [
          { ingredientId: herb1.id, quantity: 3 },
          { ingredientId: herb2.id, quantity: 1 },
          { ingredientId: herb3.id, quantity: 2 }
        ]
      }

      const response = await request(app)
        .post('/api/recipes')
        .send(recipeData)
        .expect(201)

      expect(response.body.name).toBe('Master Healing Potion')
      expect(response.body.ingredients).toHaveLength(3)

      // Verify ingredient relationships
      const ingredients = response.body.ingredients
      expect(ingredients.find((i) => i.ingredient.name === 'Healing Herb')).toBeTruthy()
      expect(ingredients.find((i) => i.ingredient.name === 'Mana Crystal')).toBeTruthy()
      expect(ingredients.find((i) => i.ingredient.name === 'Spring Water')).toBeTruthy()

      // Verify quantities
      expect(ingredients.find((i) => i.ingredient.name === 'Healing Herb').quantity).toBe(3)
      expect(ingredients.find((i) => i.ingredient.name === 'Mana Crystal').quantity).toBe(1)
      expect(ingredients.find((i) => i.ingredient.name === 'Spring Water').quantity).toBe(2)
    })

    it('should validate ingredient existence during recipe creation', async () => {
      const herb1 = await createTestIngredient({ name: 'Real Herb' })

      const recipeData = {
        name: 'Invalid Recipe',
        description: 'Recipe with non-existent ingredient',
        ingredients: [
          { ingredientId: herb1.id, quantity: 1 },
          { ingredientId: 99999, quantity: 1 } // Non-existent ingredient
        ]
      }

      const response = await request(app)
        .post('/api/recipes')
        .send(recipeData)
        .expect(400)

      expect(response.body.error).toContain('ingredient')
    })

    it('should handle duplicate ingredients in recipe', async () => {
      const herb1 = await createTestIngredient({ name: 'Duplicate Herb' })

      const recipeData = {
        name: 'Duplicate Ingredient Recipe',
        description: 'Recipe with duplicate ingredients',
        ingredients: [
          { ingredientId: herb1.id, quantity: 2 },
          { ingredientId: herb1.id, quantity: 3 } // Same ingredient twice
        ]
      }

      const response = await request(app)
        .post('/api/recipes')
        .send(recipeData)
        .expect(400)

      expect(response.body.error).toContain('duplicate')
    })
  })

  describe('Recipe Craftability Analysis', () => {
    it('should determine craftable recipes based on inventory', async () => {
      // Create ingredients
      const herb1 = await createTestIngredient({ name: 'Available Herb' })
      const herb2 = await createTestIngredient({ name: 'Scarce Herb' })
      const herb3 = await createTestIngredient({ name: 'Missing Herb' })

      // Create recipes
      const recipe1 = await createTestRecipe({ name: 'Craftable Recipe' })
      const recipe2 = await createTestRecipe({ name: 'Uncraftable Recipe' })

      // Add ingredients to recipes
      await testPrisma.recipeIngredient.createMany({
        data: [
          { recipeId: recipe1.id, ingredientId: herb1.id, quantity: 2 },
          { recipeId: recipe1.id, ingredientId: herb2.id, quantity: 1 },
          { recipeId: recipe2.id, ingredientId: herb1.id, quantity: 1 },
          { recipeId: recipe2.id, ingredientId: herb3.id, quantity: 1 }, // Missing from inventory
        ]
      })

      // Add inventory items (sufficient for recipe1, insufficient for recipe2)
      await testPrisma.inventoryItem.createMany({
        data: [
          { ingredientId: herb1.id, quantity: 5, quality: 'NORMAL' },
          { ingredientId: herb2.id, quantity: 2, quality: 'NORMAL' },
          // herb3 is missing from inventory
        ]
      })

      const response = await request(app)
        .get('/api/recipes/craftable')
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].name).toBe('Craftable Recipe')
      expect(response.body[0].canCraft).toBe(true)
    })

    it('should handle quality requirements for crafting', async () => {
      const herb = await createTestIngredient({ name: 'Quality Herb' })
      const recipe = await createTestRecipe({ name: 'Quality Recipe' })

      await testPrisma.recipeIngredient.create({
        data: { recipeId: recipe.id, ingredientId: herb.id, quantity: 1 }
      })

      // Add only LQ quality herbs
      await testPrisma.inventoryItem.create({
        data: { ingredientId: herb.id, quantity: 5, quality: 'LQ' }
      })

      const response = await request(app)
        .get('/api/recipes/craftable')
        .expect(200)

      // Should still be craftable (quality doesn't prevent crafting in basic system)
      expect(response.body).toHaveLength(1)
      expect(response.body[0].canCraft).toBe(true)
    })

    it('should handle complex inventory calculations', async () => {
      const herb1 = await createTestIngredient({ name: 'Complex Herb 1' })
      const herb2 = await createTestIngredient({ name: 'Complex Herb 2' })

      const recipe = await createTestRecipe({ name: 'Complex Recipe' })

      await testPrisma.recipeIngredient.createMany({
        data: [
          { recipeId: recipe.id, ingredientId: herb1.id, quantity: 5 },
          { recipeId: recipe.id, ingredientId: herb2.id, quantity: 3 }
        ]
      })

      // Create multiple inventory items for the same ingredient
      await testPrisma.inventoryItem.createMany({
        data: [
          { ingredientId: herb1.id, quantity: 3, quality: 'NORMAL' },
          { ingredientId: herb1.id, quantity: 2, quality: 'HQ' },
          { ingredientId: herb2.id, quantity: 1, quality: 'NORMAL' },
          { ingredientId: herb2.id, quantity: 2, quality: 'LQ' }
        ]
      })

      const response = await request(app)
        .get('/api/recipes/craftable')
        .expect(200)

      expect(response.body).toHaveLength(1)
      expect(response.body[0].canCraft).toBe(true) // 5 herb1 (3+2), 3 herb2 (1+2)
    })
  })

  describe('Recipe Updates with Ingredient Changes', () => {
    it('should handle ingredient additions in recipe updates', async () => {
      const herb1 = await createTestIngredient({ name: 'Original Herb' })
      const herb2 = await createTestIngredient({ name: 'Additional Herb' })

      // Create recipe with one ingredient
      const recipe = await createTestRecipe({ name: 'Expandable Recipe' })
      await testPrisma.recipeIngredient.create({
        data: { recipeId: recipe.id, ingredientId: herb1.id, quantity: 1 }
      })

      // Update recipe to add another ingredient
      const updateData = {
        name: 'Updated Expandable Recipe',
        ingredients: [
          { ingredientId: herb1.id, quantity: 2 }, // Updated quantity
          { ingredientId: herb2.id, quantity: 1 }  // New ingredient
        ]
      }

      const response = await request(app)
        .put(`/api/recipes/${recipe.id}`)
        .send(updateData)
        .expect(200)

      expect(response.body.name).toBe('Updated Expandable Recipe')
      expect(response.body.ingredients).toHaveLength(2)

      // Verify updated quantities and new ingredient
      const ingredients = response.body.ingredients
      expect(ingredients.find((i) => i.ingredient.name === 'Original Herb').quantity).toBe(2)
      expect(ingredients.find((i) => i.ingredient.name === 'Additional Herb').quantity).toBe(1)
    })

    it('should handle ingredient removals in recipe updates', async () => {
      const herb1 = await createTestIngredient({ name: 'Kept Herb' })
      const herb2 = await createTestIngredient({ name: 'Removed Herb' })

      // Create recipe with two ingredients
      const recipe = await createTestRecipe({ name: 'Reducible Recipe' })
      await testPrisma.recipeIngredient.createMany({
        data: [
          { recipeId: recipe.id, ingredientId: herb1.id, quantity: 1 },
          { recipeId: recipe.id, ingredientId: herb2.id, quantity: 1 }
        ]
      })

      // Update recipe to remove one ingredient
      const updateData = {
        name: 'Reduced Recipe',
        ingredients: [
          { ingredientId: herb1.id, quantity: 3 } // Only keep one ingredient, update quantity
        ]
      }

      const response = await request(app)
        .put(`/api/recipes/${recipe.id}`)
        .send(updateData)
        .expect(200)

      expect(response.body.name).toBe('Reduced Recipe')
      expect(response.body.ingredients).toHaveLength(1)
      expect(response.body.ingredients[0].ingredient.name).toBe('Kept Herb')
      expect(response.body.ingredients[0].quantity).toBe(3)
    })
  })

  describe('Recipe Deletion Constraints', () => {
    it('should prevent recipe deletion when potions are in inventory', async () => {
      const recipe = await createTestRecipe({ name: 'Used Recipe' })

      // Create a potion using this recipe
      const potion = await testPrisma.potion.create({
        data: {
          recipeId: recipe.id,
          quality: 'NORMAL'
        }
      })

      // Add potion to inventory (this is what makes it relevant for deletion constraint)
      await testPrisma.potionInventoryItem.create({
        data: {
          potionId: potion.id,
          quantity: 1
        }
      })

      const response = await request(app)
        .delete(`/api/recipes/${recipe.id}`)
        .expect(400)

      expect(response.body.error).toContain('potion')
    })

    it('should allow recipe deletion when potions exist but are not in inventory', async () => {
      const recipe = await createTestRecipe({ name: 'Recipe with Used Potions' })

      // Create a potion using this recipe but don't add it to inventory
      // This simulates a potion that was crafted and then consumed/removed
      await testPrisma.potion.create({
        data: {
          recipeId: recipe.id,
          quality: 'NORMAL'
        }
      })

      // Should allow deletion because no potions are in inventory
      await request(app)
        .delete(`/api/recipes/${recipe.id}`)
        .expect(204)

      // Verify recipe is deleted
      const checkRecipe = await testPrisma.recipe.findUnique({
        where: { id: recipe.id }
      })
      expect(checkRecipe).toBeNull()
    })

    it('should allow recipe deletion when no dependencies exist', async () => {
      const recipe = await createTestRecipe({ name: 'Unused Recipe' })
      const herb = await createTestIngredient({ name: 'Recipe Herb' })

      // Add ingredient to recipe
      await testPrisma.recipeIngredient.create({
        data: { recipeId: recipe.id, ingredientId: herb.id, quantity: 1 }
      })

      await request(app)
        .delete(`/api/recipes/${recipe.id}`)
        .expect(204)

      // Verify recipe and its ingredients are deleted
      const checkRecipe = await testPrisma.recipe.findUnique({
        where: { id: recipe.id }
      })
      expect(checkRecipe).toBeNull()

      const checkIngredients = await testPrisma.recipeIngredient.findMany({
        where: { recipeId: recipe.id }
      })
      expect(checkIngredients).toHaveLength(0)
    })
  })

  describe('Complex Integration Scenarios', () => {
    it('should handle full recipe lifecycle', async () => {
      // Create ingredients
      const herbs = await Promise.all([
        createTestIngredient({ name: 'Lifecycle Herb 1' }),
        createTestIngredient({ name: 'Lifecycle Herb 2' }),
        createTestIngredient({ name: 'Lifecycle Herb 3' })
      ])

      // Create recipe
      const recipeData = {
        name: 'Lifecycle Recipe',
        description: 'Full lifecycle test recipe',
        ingredients: herbs.map((herb, index) => ({
          ingredientId: herb.id,
          quantity: index + 1
        }))
      }

      const createResponse = await request(app)
        .post('/api/recipes')
        .send(recipeData)
        .expect(201)

      const recipeId = createResponse.body.id

      // Add inventory to make it craftable
      await Promise.all(herbs.map((herb, index) =>
        testPrisma.inventoryItem.create({
          data: {
            ingredientId: herb.id,
            quantity: (index + 1) * 2, // Double what's needed
            quality: 'NORMAL'
          }
        })
      ))

      // Check craftability
      const craftableResponse = await request(app)
        .get('/api/recipes/craftable')
        .expect(200)

      expect(craftableResponse.body.some((r) => r.id === recipeId)).toBe(true)

      // Create potion from recipe
      const inventoryItems = await Promise.all(
        herbs.map(herb =>
          testPrisma.inventoryItem.findFirst({
            where: { ingredientId: herb.id }
          })
        )
      )

      const potionResponse = await request(app)
        .post('/api/potions')
        .send({
          recipeId: recipeId,
          ingredientSelections: herbs.map((herb, index) => ({
            ingredientId: herb.id,
            inventoryItemId: inventoryItems[index]!.id,
            quantity: index + 1
          }))
        })
        .expect(201)

      expect(potionResponse.body.recipe.id).toBe(recipeId)

      // Try to delete recipe (should fail due to potion)
      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .expect(400)

      // Delete potion first
      await testPrisma.potionInventoryItem.deleteMany({
        where: { potionId: potionResponse.body.id }
      })

      await testPrisma.potion.delete({
        where: { id: potionResponse.body.id }
      })

      // Now delete recipe should succeed
      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .expect(204)
    })

    it('should handle concurrent recipe operations', async () => {
      const herb = await createTestIngredient({ name: 'Concurrent Herb' })

      // Create multiple recipes concurrently
      const recipePromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/recipes')
          .send({
            name: `Concurrent Recipe ${i}`,
            description: `Recipe ${i}`,
            ingredients: [{ ingredientId: herb.id, quantity: i + 1 }]
          })
      )

      const responses = await Promise.all(recipePromises)

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201)
      })

      // Verify all recipes exist
      const listResponse = await request(app)
        .get('/api/recipes')
        .expect(200)

      expect(listResponse.body.length).toBeGreaterThanOrEqual(5)
    })
  })
})
