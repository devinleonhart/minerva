import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.get('/', async (req, res) => {
  try {
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        ingredient: true
      },
      orderBy: {
        ingredient: {
          name: 'asc'
        }
      }
    })

    res.json(inventoryItems)
  } catch (error) {
    handleUnknownError(res, 'fetching inventory', error)
  }
})

export default router
