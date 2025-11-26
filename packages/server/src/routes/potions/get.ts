import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

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
      potions.map(async (potion: { recipeId: number }) => {
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
