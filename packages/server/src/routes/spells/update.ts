import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'

const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid spell ID' })
      return
    }

    const { name, neededStars, currentStars } = req.body

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return res.status(400).json({ error: 'Spell name must be a non-empty string' })
    }

    if (neededStars !== undefined && (typeof neededStars !== 'number' || neededStars < 1 || !Number.isInteger(neededStars))) {
      return res.status(400).json({ error: 'Needed stars must be a positive integer' })
    }

    if (currentStars !== undefined && (typeof currentStars !== 'number' || currentStars < 0 || !Number.isInteger(currentStars))) {
      return res.status(400).json({ error: 'Current stars must be a non-negative integer' })
    }

    // Get current spell to validate star constraints
    const currentSpell = await prisma.spell.findUnique({ where: { id } })
    if (!currentSpell) {
      return res.status(404).json({ error: 'Spell not found' })
    }

    const newNeededStars = neededStars !== undefined ? neededStars : currentSpell.neededStars
    const newCurrentStars = currentStars !== undefined ? currentStars : currentSpell.currentStars

    if (newCurrentStars > newNeededStars) {
      return res.status(400).json({ error: 'Current stars cannot exceed needed stars' })
    }

    const isLearned = newCurrentStars >= newNeededStars

    const spell = await prisma.spell.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(neededStars !== undefined && { neededStars: newNeededStars }),
        ...(currentStars !== undefined && { currentStars: newCurrentStars }),
        isLearned
      }
    })

    res.json(spell)
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Spell not found' })
    }
    if ((error as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: 'A spell with this name already exists' })
    }
    handleUnknownError(res, 'updating spell', error)
  }
})

export default router
