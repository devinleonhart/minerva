import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import type { PrismaClient } from '../../generated/client.js'

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>


const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required' })
    }

    // Validate description - schema requires it, so we default to empty string if not provided
    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({ error: 'Item description must be a string' })
    }

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const item = await tx.item.create({
        data: {
          name: name.trim(),
          description: description?.trim() || ''
        }
      })

      await tx.itemInventoryItem.create({
        data: {
          itemId: item.id,
          quantity: 0
        }
      })

      return item
    })

    const createdItem = await prisma.item.findUnique({
      where: { id: result.id },
      include: {
        inventoryItems: {
          select: {
            id: true,
            quantity: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    return res.status(201).json(createdItem)
  } catch (error) {
    handleUnknownError(res, 'creating item', error)
  }
})

export default router
