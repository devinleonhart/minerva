import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.get('/', async (req, res) => {
  try {
    const potions = await prisma.potion.findMany({
      orderBy: {
        id: 'desc'
      }
    })

    // Fetch recipe information for each potion separately
    const potionsWithRecipes = await Promise.all(
      potions.map(async (potion) => {
        const recipe = await prisma.recipe.findUnique({
          where: { id: potion.recipeId },
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            }
          }
        })

        return {
          ...potion,
          recipe: recipe
        }
      })
    )

    res.json(potionsWithRecipes)
  } catch (error) {
    handleUnknownError(res, 'fetching potions', error)
  }
})

export default router
