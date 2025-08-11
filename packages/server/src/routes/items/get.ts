import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

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
