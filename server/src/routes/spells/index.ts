import { Router } from 'express'
import { db } from '../../db.js'
import { spell } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
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

    if (currentStars < 0 || !Number.isInteger(currentStars)) {
      return res.status(400).json({ error: 'Current stars must be a non-negative integer' })
    }

    const [row] = await db.select().from(spell).where(eq(spell.id, id))

    if (!row) {
      return res.status(404).json({ error: 'Spell not found' })
    }

    if (currentStars > row.neededStars) {
      return res.status(400).json({ error: 'Current stars cannot exceed needed stars' })
    }

    const [updated] = await db.update(spell)
      .set({
        currentStars,
        isLearned: currentStars >= row.neededStars,
        updatedAt: new Date().toISOString()
      })
      .where(eq(spell.id, id))
      .returning()

    return res.json(updated)
  } catch (error) {
    handleUnknownError(res, 'updating spell progress', error)
  }
})

export default router
