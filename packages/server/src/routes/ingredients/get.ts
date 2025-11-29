import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
const router: Router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid ingredient ID' })
    }

    const ingredient = await prisma.ingredient.findUnique({ where: { id } })
    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }

    return res.json(ingredient)
  } catch (error) {
    handleUnknownError(res, 'fetching ingredient', error)
  }
})

router.get('/', async (req, res) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' }
    })
    return res.json(ingredients)
  } catch (error) {
    handleUnknownError(res, 'fetching ingredients', error)
  }
})

export default router
