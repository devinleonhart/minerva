import { Router } from 'express'
import { db } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

// Import route handlers
import getRoutes from './get.js'
import createRoutes from './create.js'
import updateRoutes from './update.js'
import deleteRoutes from './delete.js'

router.use('/', getRoutes)
router.use('/', createRoutes)
router.use('/', updateRoutes)
router.use('/', deleteRoutes)

// Check if ingredient can be deleted
router.get('/:id/deletable', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid ingredient ID' })
      return
    }

    const recipeUsage = await db.query.recipeIngredient.findFirst({
      where: (ri, { eq }) => eq(ri.ingredientId, id)
    })

    const inventoryUsage = await db.query.inventoryItem.findFirst({
      where: (inv, { eq }) => eq(inv.ingredientId, id)
    })

    const canDelete = !recipeUsage && !inventoryUsage

    res.json({
      canDelete,
      reason: canDelete ? null : recipeUsage ? 'Used in recipes' : 'Has inventory items'
    })
  } catch (error) {
    handleUnknownError(res, 'checking ingredient deletability', error)
  }
})

export default router
