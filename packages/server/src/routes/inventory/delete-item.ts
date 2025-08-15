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

    await prisma.itemInventoryItem.delete({
      where: { id }
    })

    res.json({ message: 'Item removed from inventory' })
  } catch (error) {
    handleUnknownError(res, 'deleting item from inventory', error)
  }
})

export default router
