import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'


const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, description, relationship, notableEvents, url, isFavorited = false } = req.body

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Person name is required' })
    }

    // Validate optional string fields
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

    const person = await prisma.person.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        relationship: relationship?.trim() || null,
        notableEvents: notableEvents?.trim() || null,
        url: url?.trim() || null,
        isFavorited: Boolean(isFavorited)
      }
    })

    return res.status(201).json(person)
  } catch (error) {
    handleUnknownError(res, 'creating person', error)
  }
})

export default router
