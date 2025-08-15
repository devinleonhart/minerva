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

    const existingInventoryItems = await prisma.itemInventoryItem.findMany({
      where: { itemId: id }
    })

    if (existingInventoryItems.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete item that has inventory items',
        inventoryItemCount: existingInventoryItems.length
      })
    }

    try {
      await prisma.item.delete({
        where: { id }
      })
      res.status(204).send()
    } catch (deleteError: unknown) {
      if (deleteError && typeof deleteError === 'object' && 'code' in deleteError && deleteError.code === 'P2025') {
        // Record not found
        res.status(404).json({ error: 'Item not found' })
        return
      }
      throw deleteError
    }
  } catch (error) {
    handleUnknownError(res, 'deleting item', error)
  }
})

export default router
