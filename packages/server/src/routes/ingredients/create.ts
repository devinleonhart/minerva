import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
const router: Router = Router()

router.post('/', async (req, res) => {
  const { name, description, secured = false } = req.body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'Ingredient name is required' })
    return
  }

  if (!description || typeof description !== 'string') {
    res.status(400).json({ error: 'Ingredient description is required' })
    return
  }

  try {
    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        description,
        secured: Boolean(secured)
      }
    })
    res.status(201).json(ingredient)
  } catch (error) {
    handleUnknownError(res, 'creating ingredient', error)
  }
})

export default router
