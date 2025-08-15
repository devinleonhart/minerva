import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

import getRoutes from './get.js'
import createRoutes from './create.js'
import deleteRoutes from './delete.js'

router.use('/', getRoutes)
router.use('/', createRoutes)
router.use('/', deleteRoutes)

// Check if item can be deleted
router.get('/:id/deletable', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid item ID' })
      return
    }

    // Check if item has any inventory items
    const inventoryUsage = await prisma.itemInventoryItem.findFirst({
      where: { itemId: id }
    })

    const canDelete = !inventoryUsage

    res.json({
      canDelete,
      reason: canDelete ? null : 'Has inventory items'
    })
  } catch (error) {
    handleUnknownError(res, 'checking item deletability', error)
  }
})

export default router
