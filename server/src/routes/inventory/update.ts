import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid inventory item ID' })
    }

    const { quality, quantity } = req.body

    // Check if inventory item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id }
    })

    if (!existingItem) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    // Validate quality if provided
    if (quality !== undefined) {
      if (typeof quality !== 'string' || !['NORMAL', 'HQ', 'LQ'].includes(quality)) {
        return res.status(400).json({ error: 'Invalid quality. Must be NORMAL, HQ, or LQ' })
      }
    }

    // Validate quantity if provided
    if (quantity !== undefined && (quantity < 0 || !Number.isInteger(quantity))) {
      return res.status(400).json({ error: 'Quantity must be a non-negative integer' })
    }

    // Build update data object
    const updateData: {
      quality?: string
      quantity?: number
    } = {}

    if (quality !== undefined) {
      updateData.quality = quality
    }
    if (quantity !== undefined) {
      updateData.quantity = quantity
    }

    // Update the inventory item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        ingredient: true
      }
    })

    return res.json(updatedItem)
  } catch (error) {
    handleUnknownError(res, 'updating inventory item', error)
  }
})

export default router
