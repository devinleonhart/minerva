import { Router } from 'express'
import { db } from '../../db.js'
import { recipe, recipeIngredient, ingredient } from '../../../db/index.js'
import { eq, inArray } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

interface RecipeIngredientInput {
  ingredientId: number
  quantity: number
}

const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    const { name, description, ingredients } = req.body as {
      name?: string
      description?: string
      ingredients?: RecipeIngredientInput[]
    }

    if (id === null) {
      return res.status(400).json({ error: 'Invalid recipe ID' })
    }

    const existingRecipe = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, id)
    })

    if (!existingRecipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Update recipe with ingredients in a transaction
    await db.transaction(async (tx) => {
      // Validate name if provided
      if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        throw new Error('Recipe name is required')
      }

      // Validate description if provided
      if (description !== undefined && (typeof description !== 'string' || description.trim() === '')) {
        throw new Error('Recipe description is required')
      }

      // Validate ingredients if provided
      if (ingredients !== undefined) {
        if (!Array.isArray(ingredients)) {
          throw new Error('Ingredients must be an array')
        }
        if (ingredients.length === 0) {
          throw new Error('Recipe must have at least one ingredient')
        }

        // Check for duplicate ingredients
        const ingredientIds = ingredients.map((ing: RecipeIngredientInput) => ing.ingredientId)
        const uniqueIngredientIds = [...new Set(ingredientIds)]
        if (ingredientIds.length !== uniqueIngredientIds.length) {
          throw new Error('Recipe cannot contain duplicate ingredients')
        }
      }

      // Update basic recipe info
      await tx.update(recipe).set({
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        updatedAt: new Date().toISOString()
      }).where(eq(recipe.id, id))

      // Update ingredients if provided
      if (ingredients !== undefined) {
        // Verify all ingredients exist
        const ingredientIds = ingredients.map((ing: RecipeIngredientInput) => ing.ingredientId)
        const uniqueIngredientIds = [...new Set(ingredientIds)]
        const existingIngredients = await tx.select().from(ingredient).where(inArray(ingredient.id, ingredientIds))

        if (existingIngredients.length !== uniqueIngredientIds.length) {
          throw new Error('One or more ingredients not found')
        }

        // Remove existing recipe-ingredient relationships
        await tx.delete(recipeIngredient).where(eq(recipeIngredient.recipeId, id))

        // Create new recipe-ingredient relationships with quantities
        await Promise.all(
          ingredients.map((ing: RecipeIngredientInput) =>
            tx.insert(recipeIngredient).values({
              recipeId: id,
              ingredientId: ing.ingredientId,
              quantity: ing.quantity || 1
            })
          )
        )
      }
    })

    // Fetch the updated recipe with ingredients
    const recipeWithIngredients = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      with: {
        ingredients: {
          with: { ingredient: true }
        }
      }
    })

    return res.json(recipeWithIngredients)
  } catch (error) {
    // Handle validation errors from transaction
    if (error instanceof Error) {
      const errorMessage = error.message
      if (errorMessage.includes('required') || errorMessage.includes('must be') || errorMessage.includes('duplicate') || errorMessage.includes('not found')) {
        return res.status(400).json({ error: errorMessage })
      }
    }
    handleUnknownError(res, 'updating recipe', error)
  }
})

export default router
