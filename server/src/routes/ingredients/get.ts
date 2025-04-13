import { Router } from 'express'
import { PrismaClient } from '../../../generated/prisma'
import { parseId } from '../../utils/parseId'
import { handleUnknownError } from '../../utils/handleUnknownError'

const prisma = new PrismaClient()
const router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid ingredient ID' })
      return
    }
    else {
      const ingredient = await prisma.ingredient.findUnique({ where: { id } })
      if (!ingredient) {
        res.status(404).json({ error: 'Ingredient not found' })
        return
      }
      else {
        res.json(ingredient)
      }
    }
  } catch (error) {
    handleUnknownError(res, 'fetching ingredient', error)
  }
})

router.get('/', async (req, res) => {
  try {
    const ingredients = await prisma.ingredient.findMany()
    res.json(ingredients)
  } catch (error) {
    handleUnknownError(res, 'fetching ingredients', error)
  }
})

export default router
