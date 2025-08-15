import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()

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

    const spell = await prisma.spell.create({
      data: {
        name: name.trim(),
        neededStars,
        currentStars,
        isLearned
      }
    })

    res.status(201).json(spell)
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: 'A spell with this name already exists' })
    }
    handleUnknownError(res, 'creating spell', error)
  }
})

export default router
