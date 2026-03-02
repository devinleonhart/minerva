import { Router } from 'express'
import { db } from '../../db.js'
import { ingredient } from '../../../db/index.js'
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
    const [row] = await db.insert(ingredient).values({
      name: name.trim(),
      description: description.trim(),
      secured: Boolean(secured),
      updatedAt: new Date().toISOString()
    }).returning()
    return res.status(201).json(row)
  } catch (error) {
    handleUnknownError(res, 'creating ingredient', error)
  }
})

export default router
