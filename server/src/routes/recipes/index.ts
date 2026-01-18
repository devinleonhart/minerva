import { Router } from 'express'
import { prisma } from '../../db.js'
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

    // Check if recipe has potions that are currently in inventory
    const potionsInInventory = await prisma.potionInventoryItem.findMany({
      include: {
        potion: true
      },
      where: {
        potion: {
          recipeId: id
        }
      }
    })

    const canDelete = potionsInInventory.length === 0

    return res.json({
      canDelete,
      reason: canDelete ? null : 'Has associated potions'
    })
  } catch (error) {
    handleUnknownError(res, 'checking recipe deletability', error)
  }
})

export default router
