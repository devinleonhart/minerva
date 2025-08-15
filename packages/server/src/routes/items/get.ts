import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid item ID' })
      return
    }

    const item = await prisma.item.findUnique({ where: { id } })
    if (!item) {
      res.status(404).json({ error: 'Item not found' })
      return
    }

    res.json(item)
  } catch (error) {
    handleUnknownError(res, 'fetching item', error)
  }
})

router.get('/', async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    res.json(items)
  } catch (error) {
    handleUnknownError(res, 'fetching items', error)
  }
})

export default router
