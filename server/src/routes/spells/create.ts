import { Router } from 'express'
import { db } from '../../db.js'
import { spell } from '../../../db/index.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, neededStars = 1, currentStars = 0 } = req.body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Spell name is required' })
    }

    if (name.trim().length > 255) {
      return res.status(400).json({ error: 'Spell name must be 255 characters or less' })
    }

    if (neededStars !== undefined && (typeof neededStars !== 'number' || neededStars < 1 || !Number.isInteger(neededStars))) {
      return res.status(400).json({ error: 'Needed stars must be a positive integer' })
    }

    if (currentStars !== undefined && (typeof currentStars !== 'number' || currentStars < 0 || !Number.isInteger(currentStars))) {
      return res.status(400).json({ error: 'Current stars must be a non-negative integer' })
    }

    if (currentStars > neededStars) {
      return res.status(400).json({ error: 'Current stars cannot exceed needed stars' })
    }

    const isLearned = currentStars >= neededStars

    const [row] = await db.insert(spell).values({
      name: name.trim(),
      neededStars,
      currentStars,
      isLearned,
      updatedAt: new Date().toISOString()
    }).returning()

    return res.status(201).json(row)
  } catch (error) {
    const e = error as { code?: string; cause?: { code?: string } }
    if (e?.code === '23505' || e?.cause?.code === '23505') {
      return res.status(409).json({ error: 'A spell with this name already exists' })
    }
    handleUnknownError(res, 'creating spell', error)
  }
})

export default router
