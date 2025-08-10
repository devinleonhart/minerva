import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    const { name, description, ingredientIds } = req.body

    if (id === null) {
      res.status(400).json({ error: 'Invalid ID' })
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
    const updatedRecipe = await prisma.$transaction(async (tx) => {
      // Update basic recipe info
      const recipe = await tx.recipe.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description })
        }
      })

      // Update ingredients if provided
      if (ingredientIds !== undefined) {
        // Verify all ingredients exist
        const ingredients = await tx.ingredient.findMany({
          where: {
            id: { in: ingredientIds }
          }
        })

        if (ingredients.length !== ingredientIds.length) {
          throw new Error('One or more ingredients not found')
        }

        // Remove existing recipe-ingredient relationships
        await tx.recipeIngredient.deleteMany({
          where: { recipeId: id }
        })

        // Create new recipe-ingredient relationships
        await Promise.all(
          ingredientIds.map(ingredientId =>
            tx.recipeIngredient.create({
              data: {
                recipeId: id,
                ingredientId
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
