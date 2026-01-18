import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid person ID' })
    }

    const person = await prisma.person.findUnique({ where: { id } })
    if (!person) {
      return res.status(404).json({ error: 'Person not found' })
    }

    return res.json(person)
  } catch (error) {
    handleUnknownError(res, 'fetching person', error)
  }
})

router.get('/', async (req, res) => {
  try {
    const people = await prisma.person.findMany({
      orderBy: [
        { isFavorited: 'desc' },
        { name: 'asc' }
      ]
    })

    return res.json(people)
  } catch (error) {
    handleUnknownError(res, 'fetching people', error)
  }
})

export default router
