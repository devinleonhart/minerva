import { Router } from 'express'
import { prisma } from '../../db.js'
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
      res.status(400).json({ error: 'Invalid recipe ID' })
      return
    }

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id }
    })

    if (!existingRecipe) {
      res.status(404).json({ error: 'Recipe not found' })
      return
    }

    // Update recipe with ingredients in a transaction
    await prisma.$transaction(async (tx) => {
      // Update basic recipe info
      const recipe = await tx.recipe.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description })
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

        if (existingIngredients.length !== ingredientIds.length) {
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

    res.json(recipeWithIngredients)
  } catch (error) {
    handleUnknownError(res, 'updating recipe', error)
  }
})

export default router
