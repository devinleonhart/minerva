import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
const router: Router = Router()

router.post('/', async (req, res) => {
  const { name, description, secured = false } = req.body

  // Validate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Ingredient name is required' })
  }

  // Validate description
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'Ingredient description is required' })
  }

  try {
    const ingredient = await prisma.ingredient.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        secured: Boolean(secured)
      }
    })
    return res.status(201).json(ingredient)
  } catch (error) {
    handleUnknownError(res, 'creating ingredient', error)
  }
})

export default router
