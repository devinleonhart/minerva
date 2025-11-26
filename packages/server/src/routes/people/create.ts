import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'


const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, description, relationship, notableEvents, url, isFavorited = false } = req.body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Person name is required' })
    }

    const person = await prisma.person.create({
      data: {
        name: name.trim(),
        description: description || null,
        relationship: relationship || null,
        notableEvents: notableEvents || null,
        url: url || null,
        isFavorited: Boolean(isFavorited)
      }
    })

    res.status(201).json(person)
  } catch (error) {
    handleUnknownError(res, 'creating person', error)
  }
})

export default router
