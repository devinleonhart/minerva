import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import getRoutes from './get.js'
import createRoutes from './create.js'
import updateRoutes from './update.js'
import deleteRoutes from './delete.js'

const router: Router = Router()

router.use('/', getRoutes)
router.use('/', createRoutes)
router.use('/', updateRoutes)
router.use('/', deleteRoutes)

// Toggle favorite status
router.patch('/:id/favorite', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid person ID' })
    }

    const person = await prisma.person.findUnique({
      where: { id }
    })

    if (!person) {
      return res.status(404).json({ error: 'Person not found' })
    }

    const updatedPerson = await prisma.person.update({
      where: { id },
      data: { isFavorited: !person.isFavorited }
    })

    return res.json(updatedPerson)
  } catch (error) {
    handleUnknownError(res, 'toggling person favorite status', error)
  }
})

export default router
