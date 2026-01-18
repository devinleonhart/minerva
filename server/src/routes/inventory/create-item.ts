import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, description, quantity = 1 } = req.body

    if (!name || !description) {
      res.status(400).json({ error: 'name and description are required' })
      return
    }

    // Validate quantity
    if (quantity < 1 || !Number.isInteger(quantity)) {
      res.status(400).json({ error: 'quantity must be a positive integer' })
      return
    }

    // Create new item
    const item = await prisma.item.create({
      data: {
        name,
        description
      }
    })

    // Add item to inventory
    const inventoryItem = await prisma.itemInventoryItem.create({
      data: {
        itemId: item.id,
        quantity
      },
      include: {
        item: true
      }
    })

    res.status(201).json(inventoryItem)
  } catch (error) {
    handleUnknownError(res, 'creating item in inventory', error)
  }
})

export default router
