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

    // Delete the inventory item
    await prisma.inventoryItem.delete({
      where: { id }
    })

    res.json({ message: 'Inventory item deleted successfully' })
  } catch (error) {
    handleUnknownError(res, 'deleting inventory item', error)
  }
})

export default router
