import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid ingredient ID' })
    }

    const { name, description, secured } = req.body

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'Ingredient name is required' })
    }

    if (description !== undefined && typeof description !== 'string' && description !== null) {
      return res.status(400).json({ error: 'Description must be a string or null' })
    }

    if (secured !== undefined && typeof secured !== 'boolean') {
      return res.status(400).json({ error: 'Secured must be a boolean' })
    }

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(secured !== undefined && { secured })
      }
    })

    res.json(ingredient)
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Ingredient not found' })
    }
    handleUnknownError(res, 'updating ingredient', error)
  }
})

export default router
