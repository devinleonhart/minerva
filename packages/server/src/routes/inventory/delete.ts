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
      return res.status(400).json({ error: 'Invalid inventory item ID' })
    }

    // This endpoint is specifically for ingredient inventory items
    // Check if this is a general inventory item (ingredient)
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id }
    })

    if (!inventoryItem) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    await prisma.inventoryItem.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    handleUnknownError(res, 'deleting inventory item', error)
  }
})

export default router
