import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.get('/', async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    res.json(recipes)
  } catch (error) {
    handleUnknownError(res, 'fetching recipes', error)
  }
})

export default router
