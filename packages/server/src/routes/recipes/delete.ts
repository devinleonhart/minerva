import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)

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

    // Delete recipe with ingredients in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete recipe-ingredient relationships first
      await tx.recipeIngredient.deleteMany({
        where: { recipeId: id }
      })

      // Delete the recipe
      await tx.recipe.delete({
        where: { id }
      })
    })

    res.json({ message: 'Recipe deleted successfully' })
  } catch (error) {
    handleUnknownError(res, 'deleting recipe', error)
  }
})

export default router
