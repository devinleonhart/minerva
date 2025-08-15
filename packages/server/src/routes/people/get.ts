import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid person ID' })
      return
    }

    const person = await prisma.person.findUnique({ where: { id } })
    if (!person) {
      res.status(404).json({ error: 'Person not found' })
      return
    }

    res.json(person)
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

    res.json(people)
  } catch (error) {
    handleUnknownError(res, 'fetching people', error)
  }
})

export default router
