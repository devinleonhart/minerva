import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid recipe ID' })
      return
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    })

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' })
      return
    }

    res.json(recipe)
  } catch (error) {
    handleUnknownError(res, 'fetching recipe', error)
  }
})

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
