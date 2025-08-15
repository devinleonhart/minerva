import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import getRoutes from './get.js'
import createRoutes from './create.js'
import updateRoutes from './update.js'
import deleteRoutes from './delete.js'

const router: Router = Router()
const prisma = new PrismaClient()

router.use('/', getRoutes)
router.use('/', createRoutes)
router.use('/', updateRoutes)
router.use('/', deleteRoutes)

// Update spell progress
router.patch('/:id/progress', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid spell ID' })
    }

    const { currentStars } = req.body

    if (currentStars === undefined || typeof currentStars !== 'number') {
      return res.status(400).json({ error: 'Current stars is required and must be a number' })
    }

    if (currentStars < 0) {
      return res.status(400).json({ error: 'Current stars must be a non-negative integer' })
    }

    const spell = await prisma.spell.findUnique({
      where: { id }
    })

    if (!spell) {
      return res.status(404).json({ error: 'Spell not found' })
    }

    if (currentStars > spell.neededStars) {
      return res.status(400).json({ error: 'Current stars cannot exceed needed stars' })
    }

    const updatedSpell = await prisma.spell.update({
      where: { id },
      data: {
        currentStars,
        isLearned: currentStars >= spell.neededStars
      }
    })

    res.json(updatedSpell)
  } catch (error) {
    handleUnknownError(res, 'updating spell progress', error)
  }
})

export default router
