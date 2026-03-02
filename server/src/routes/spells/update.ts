import { Router } from 'express'
import { db } from '../../db.js'
import { spell } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'

const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid spell ID' })
    }

    const { name, neededStars, currentStars } = req.body

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Spell name must be a non-empty string' })
      }
      if (name.trim().length > 255) {
        return res.status(400).json({ error: 'Spell name must be 255 characters or less' })
      }
    }

    if (neededStars !== undefined && (typeof neededStars !== 'number' || neededStars < 1 || !Number.isInteger(neededStars))) {
      return res.status(400).json({ error: 'Needed stars must be a positive integer' })
    }

    if (currentStars !== undefined && (typeof currentStars !== 'number' || currentStars < 0 || !Number.isInteger(currentStars))) {
      return res.status(400).json({ error: 'Current stars must be a non-negative integer' })
    }

    // Get current spell to validate star constraints
    const [currentSpell] = await db.select().from(spell).where(eq(spell.id, id))
    if (!currentSpell) {
      return res.status(404).json({ error: 'Spell not found' })
    }

    const newNeededStars = neededStars !== undefined ? neededStars : currentSpell.neededStars
    const newCurrentStars = currentStars !== undefined ? currentStars : currentSpell.currentStars

    if (newCurrentStars > newNeededStars) {
      return res.status(400).json({ error: 'Current stars cannot exceed needed stars' })
    }

    const isLearned = newCurrentStars >= newNeededStars

    const [row] = await db.update(spell).set({
      ...(name !== undefined && { name: name.trim() }),
      ...(neededStars !== undefined && { neededStars: newNeededStars }),
      ...(currentStars !== undefined && { currentStars: newCurrentStars }),
      isLearned,
      updatedAt: new Date().toISOString()
    }).where(eq(spell.id, id)).returning()

    if (!row) {
      return res.status(404).json({ error: 'Spell not found' })
    }

    return res.json(row)
  } catch (error) {
    const e = error as { code?: string; cause?: { code?: string } }
    if (e?.code === '23505' || e?.cause?.code === '23505') {
      return res.status(409).json({ error: 'A spell with this name already exists' })
    }
    handleUnknownError(res, 'updating spell', error)
  }
})

export default router
