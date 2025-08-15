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
      res.status(400).json({ error: 'Invalid ingredient ID' })
      return
    }

    // Check if ingredient is used in any recipes
    const recipeUsage = await prisma.recipeIngredient.findFirst({
      where: { ingredientId: id }
    })

    if (recipeUsage) {
      res.status(400).json({
        error: 'Cannot delete ingredient that is used in recipes',
        code: 'INGREDIENT_IN_USE'
      })
      return
    }

    // Check if ingredient has any inventory items
    const inventoryUsage = await prisma.inventoryItem.findFirst({
      where: { ingredientId: id }
    })

    if (inventoryUsage) {
      res.status(400).json({
        error: 'Cannot delete ingredient that has inventory items',
        code: 'INGREDIENT_IN_INVENTORY'
      })
      return
    }

    const ingredient = await prisma.ingredient.delete({ where: { id } })
    if (!ingredient) {
      res.status(404).json({ error: 'Ingredient not found' })
      return
    }

    res.status(204).send()
  } catch (error) {
    handleUnknownError(res, 'deleting ingredient', error)
  }
})

export default router
