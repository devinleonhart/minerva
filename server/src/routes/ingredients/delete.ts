import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid ingredient ID' })
    }

    // Check if ingredient is used in any recipes
    const recipeUsage = await prisma.recipeIngredient.findFirst({
      where: { ingredientId: id }
    })

    if (recipeUsage) {
      return res.status(400).json({
        error: 'Cannot delete ingredient that is used in recipes',
        code: 'INGREDIENT_IN_USE'
      })
    }

    // Check if ingredient has any inventory items
    const inventoryUsage = await prisma.inventoryItem.findFirst({
      where: { ingredientId: id }
    })

    if (inventoryUsage) {
      return res.status(400).json({
        error: 'Cannot delete ingredient that has inventory items',
        code: 'INGREDIENT_IN_INVENTORY'
      })
    }

    try {
      await prisma.ingredient.delete({ where: { id } })
      return res.status(204).send()
    } catch (deleteError: unknown) {
      if (deleteError && typeof deleteError === 'object' && 'code' in deleteError && deleteError.code === 'P2025') {
        return res.status(404).json({ error: 'Ingredient not found' })
      }
      throw deleteError
    }
  } catch (error) {
    handleUnknownError(res, 'deleting ingredient', error)
  }
})

export default router
