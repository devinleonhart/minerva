import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'


const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid inventory item ID' })
    }

    // Check if inventory item exists
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id }
    })

    if (!inventoryItem) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    await prisma.inventoryItem.delete({
      where: { id }
    })

    return res.status(204).send()
  } catch (error) {
    handleUnknownError(res, 'deleting inventory item', error)
  }
})

export default router
