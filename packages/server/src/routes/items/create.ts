import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

interface CreateItemRequest {
  name: string
  description: string
}

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body as CreateItemRequest

    if (!name || !description) {
      res.status(400).json({ error: 'Name and description are required' })
      return
    }

    // Create the item and add it to inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the item
      const item = await tx.item.create({
        data: {
          name,
          description
        }
      })

      // Automatically add it to inventory
      await tx.itemInventoryItem.create({
        data: {
          itemId: item.id
        }
      })

      return item
    })

    // Fetch the created item with inventory details
    const itemWithInventory = await prisma.item.findUnique({
      where: { id: result.id },
      include: {
        inventoryItems: true
      }
    })

    res.json(itemWithInventory)
  } catch (error) {
    handleUnknownError(res, 'creating item', error)
  }
})

export default router
