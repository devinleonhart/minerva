import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import type { PrismaClient } from '../../generated/client.js'

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>

interface RecipeIngredientInput {
  ingredientId: number
  quantity: number
}



const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, description, ingredients } = req.body as {
      name: string
      description: string
      ingredients: RecipeIngredientInput[]
    }

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Recipe name is required' })
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return res.status(400).json({ error: 'Recipe description is required' })
    }

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'Ingredients array is required' })
    }

    if (ingredients.length === 0) {
      return res.status(400).json({ error: 'Recipe must have at least one ingredient' })
    }

    // Check for duplicate ingredients
    const ingredientIds = ingredients.map((ing: RecipeIngredientInput) => ing.ingredientId)
    const uniqueIngredientIds = [...new Set(ingredientIds)]

    if (ingredientIds.length !== uniqueIngredientIds.length) {
      return res.status(400).json({ error: 'Recipe cannot contain duplicate ingredients' })
    }

    // Verify all ingredients exist
    const existingIngredients = await prisma.ingredient.findMany({
      where: {
        id: { in: uniqueIngredientIds }
      }
    })

    if (existingIngredients.length !== uniqueIngredientIds.length) {
      return res.status(400).json({ error: 'One or more ingredients not found' })
    }

    // Create recipe with ingredients in a transaction
    const recipe = await prisma.$transaction(async (tx: TransactionClient) => {
      // Create the recipe
      const newRecipe = await tx.recipe.create({
        data: {
          name: name.trim(),
          description: description.trim()
        }
      })

      // Create recipe-ingredient relationships with quantities
      await Promise.all(
        ingredients.map((ing: RecipeIngredientInput) =>
          tx.recipeIngredient.create({
            data: {
              recipeId: newRecipe.id,
              ingredientId: ing.ingredientId,
              quantity: ing.quantity || 1
            }
          })
        )
      )

      return newRecipe
    })

    // Fetch the created recipe with ingredients
    const recipeWithIngredients = await prisma.recipe.findUnique({
      where: { id: recipe.id },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    })

    return res.status(201).json(recipeWithIngredients)
  } catch (error) {
    handleUnknownError(res, 'creating recipe', error)
  }
})

export default router
