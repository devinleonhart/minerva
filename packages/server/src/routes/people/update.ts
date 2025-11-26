import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'

const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid person ID' })
      return
    }

    const { name, description, relationship, notableEvents, url, isFavorited } = req.body

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'Person name is required' })
    }

    if (description !== undefined && typeof description !== 'string' && description !== null) {
      return res.status(400).json({ error: 'Description must be a string or null' })
    }

    if (relationship !== undefined && typeof relationship !== 'string' && relationship !== null) {
      return res.status(400).json({ error: 'Relationship must be a string or null' })
    }

    if (notableEvents !== undefined && typeof notableEvents !== 'string' && notableEvents !== null) {
      return res.status(400).json({ error: 'Notable events must be a string or null' })
    }

    if (url !== undefined && typeof url !== 'string' && url !== null) {
      return res.status(400).json({ error: 'URL must be a string or null' })
    }

    if (isFavorited !== undefined && typeof isFavorited !== 'boolean') {
      return res.status(400).json({ error: 'isFavorited must be a boolean' })
    }

    const person = await prisma.person.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(relationship !== undefined && { relationship }),
        ...(notableEvents !== undefined && { notableEvents }),
        ...(url !== undefined && { url }),
        ...(isFavorited !== undefined && { isFavorited })
      }
    })

    res.json(person)
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Person not found' })
    }
    handleUnknownError(res, 'updating person', error)
  }
})

export default router
