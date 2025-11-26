import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { quantity } = req.body

    if (quantity === undefined || quantity === null) {
      res.status(400).json({ error: 'quantity is required' })
      return
    }

    if (quantity < 0 || !Number.isInteger(quantity)) {
      res.status(400).json({ error: 'quantity must be a non-negative integer' })
      return
    }

    // Check if item inventory item exists
    const itemInventoryItem = await prisma.itemInventoryItem.findUnique({
      where: { id: parseInt(id) },
      include: { item: true }
    })

    if (!itemInventoryItem) {
      res.status(404).json({ error: 'Item inventory item not found' })
      return
    }

    // Update quantity
    const updatedItem = await prisma.itemInventoryItem.update({
      where: { id: parseInt(id) },
      data: { quantity },
      include: { item: true }
    })

    res.json(updatedItem)
  } catch (error) {
    handleUnknownError(res, 'updating item quantity', error)
  }
})

export default router
