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
      res.status(400).json({ error: 'Invalid item ID' })
      return
    }

    // Check if item has any inventory items
    const inventoryUsage = await prisma.itemInventoryItem.findFirst({
      where: { itemId: id }
    })

    if (inventoryUsage) {
      res.status(400).json({
        error: 'Cannot delete item that has inventory items',
        code: 'ITEM_IN_INVENTORY'
      })
      return
    }

    const item = await prisma.item.delete({ where: { id } })
    if (!item) {
      res.status(404).json({ error: 'Item not found' })
      return
    }

    res.status(204).send()
  } catch (error) {
    handleUnknownError(res, 'deleting item', error)
  }
})

export default router
