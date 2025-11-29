import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import type { PrismaClient } from '../../generated/client.js'

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>

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

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id }
    })

    if (!existingRecipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Update recipe with ingredients in a transaction
    await prisma.$transaction(async (tx: TransactionClient) => {
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
      const recipe = await tx.recipe.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(description !== undefined && { description: description.trim() })
        }
      })

      // Update ingredients if provided
      if (ingredients !== undefined) {
        // Verify all ingredients exist
        const ingredientIds = ingredients.map((ing: RecipeIngredientInput) => ing.ingredientId)
        const existingIngredients = await tx.ingredient.findMany({
          where: {
            id: { in: ingredientIds }
          }
        })

        const uniqueIngredientIds = [...new Set(ingredientIds)]
        if (existingIngredients.length !== uniqueIngredientIds.length) {
          throw new Error('One or more ingredients not found')
        }

        // Remove existing recipe-ingredient relationships
        await tx.recipeIngredient.deleteMany({
          where: { recipeId: id }
        })

        // Create new recipe-ingredient relationships with quantities
        await Promise.all(
          ingredients.map((ing: RecipeIngredientInput) =>
            tx.recipeIngredient.create({
              data: {
                recipeId: id,
                ingredientId: ing.ingredientId,
                quantity: ing.quantity || 1
              }
            })
          )
        )
      }

      return recipe
    })

    // Fetch the updated recipe with ingredients
    const recipeWithIngredients = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
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
