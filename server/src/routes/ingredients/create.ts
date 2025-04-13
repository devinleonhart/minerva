import { Router } from 'express'
import { PrismaClient } from '../../../generated/prisma'
import { handleUnknownError } from '../../utils/handleUnknownError'

const prisma = new PrismaClient()
const router = Router()

router.post('/', async (req, res) => {
  const { name, description } = req.body

  if (!name || !description) {
    res.status(400).json({ error: 'Name and description are required.' })
    return
  }

  try {
    const ingredient = await prisma.ingredient.create({
      data: { name, description }
    })
    res.status(201).json(ingredient)
  } catch (error) {
    handleUnknownError(res, 'creating ingredient', error)
  }
})

export default router
