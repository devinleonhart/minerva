import { Router } from 'express'
import { db } from '../../db.js'
import { potionInventoryItem, potion } from '../../../db/index.js'
import { eq, inArray } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import getRoutes from './get.js'
import createRoutes from './create.js'
import updateRoutes from './update.js'
import deleteRoutes from './delete.js'
import craftableRoutes from './craftable.js'

const router: Router = Router()

router.use('/', craftableRoutes)  // Must come before /:id routes
router.use('/', getRoutes)
router.use('/', createRoutes)
router.use('/', updateRoutes)
router.use('/', deleteRoutes)

// Check if recipe can be deleted
router.get('/:id/deletable', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid recipe ID' })
    }

    const potionsForRecipe = await db.select().from(potion).where(eq(potion.recipeId, id))
    const potionIds = potionsForRecipe.map(p => p.id)

    let canDelete = true
    if (potionIds.length > 0) {
      const potionsInInventory = await db.select().from(potionInventoryItem)
        .where(inArray(potionInventoryItem.potionId, potionIds))
      canDelete = potionsInInventory.length === 0
    }

    return res.json({
      canDelete,
      reason: canDelete ? null : 'Has associated potions'
    })
  } catch (error) {
    handleUnknownError(res, 'checking recipe deletability', error)
  }
})

export default router
