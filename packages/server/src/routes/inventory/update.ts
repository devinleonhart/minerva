import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    const { quality, quantity } = req.body

    if (id === null) {
      res.status(400).json({ error: 'Invalid ID' })
      return
    }

    // Check if inventory item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id }
    })

    if (!existingItem) {
      res.status(404).json({ error: 'Inventory item not found' })
      return
    }

    // Validate quality if provided
    if (quality && !['NORMAL', 'HQ', 'LQ'].includes(quality)) {
      res.status(400).json({ error: 'Invalid quality. Must be NORMAL, HQ, or LQ' })
      return
    }

    // Validate quantity if provided
    if (quantity !== undefined && (quantity < 0 || !Number.isInteger(quantity))) {
      res.status(400).json({ error: 'Quantity must be a non-negative integer' })
      return
    }

    // Update the inventory item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(quality !== undefined && { quality }),
        ...(quantity !== undefined && { quantity })
      },
      include: {
        ingredient: true
      }
    })

    res.json(updatedItem)
  } catch (error) {
    handleUnknownError(res, 'updating inventory item', error)
  }
})

export default router
