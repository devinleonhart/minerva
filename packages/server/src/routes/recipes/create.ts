import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

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

    if (!name || !description || !ingredients || !Array.isArray(ingredients)) {
      res.status(400).json({ error: 'name, description, and ingredients array are required' })
      return
    }

    // Check for duplicate ingredients
    const ingredientIds = ingredients.map((ing: RecipeIngredientInput) => ing.ingredientId)
    const uniqueIngredientIds = [...new Set(ingredientIds)]

    if (ingredientIds.length !== uniqueIngredientIds.length) {
      res.status(400).json({ error: 'Recipe cannot contain duplicate ingredients' })
      return
    }

    // Verify all ingredients exist
    const existingIngredients = await prisma.ingredient.findMany({
      where: {
        id: { in: uniqueIngredientIds }
      }
    })

    if (existingIngredients.length !== uniqueIngredientIds.length) {
      res.status(400).json({ error: 'One or more ingredients not found' })
      return
    }

    // Create recipe with ingredients in a transaction
    const recipe = await prisma.$transaction(async (tx) => {
      // Create the recipe
      const newRecipe = await tx.recipe.create({
        data: {
          name,
          description
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

    res.status(201).json(recipeWithIngredients)
  } catch (error) {
    handleUnknownError(res, 'creating recipe', error)
  }
})

export default router
