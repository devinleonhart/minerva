import { Router } from 'express'
import { db } from '../../db.js'
import { ingredient } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
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
    const recipeUsage = await db.query.recipeIngredient.findFirst({
      where: (ri, { eq }) => eq(ri.ingredientId, id)
    })

    if (recipeUsage) {
      return res.status(400).json({
        error: 'Cannot delete ingredient that is used in recipes',
        code: 'INGREDIENT_IN_USE'
      })
    }

    // Check if ingredient has any inventory items
    const inventoryUsage = await db.query.inventoryItem.findFirst({
      where: (inv, { eq }) => eq(inv.ingredientId, id)
    })

    if (inventoryUsage) {
      return res.status(400).json({
        error: 'Cannot delete ingredient that has inventory items',
        code: 'INGREDIENT_IN_INVENTORY'
      })
    }

    const [row] = await db.delete(ingredient).where(eq(ingredient.id, id)).returning()
    if (!row) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }
    return res.status(204).send()
  } catch (error) {
    handleUnknownError(res, 'deleting ingredient', error)
  }
})

export default router
