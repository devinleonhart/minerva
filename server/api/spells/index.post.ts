import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { spell } from '../../db/index.js'

export default eventHandler(async (event) => {
  try {
    const { name, neededStars = 1, currentStars = 0 } = await readBody<{ name?: unknown; neededStars?: unknown; currentStars?: unknown }>(event) ?? {}

    if (!name || typeof name !== 'string' || name.trim() === '') {
      setResponseStatus(event, 400)
      return { error: 'Spell name is required' }
    }

    if (name.trim().length > 255) {
      setResponseStatus(event, 400)
      return { error: 'Spell name must be 255 characters or less' }
    }

    if (neededStars !== undefined && (typeof neededStars !== 'number' || neededStars < 1 || !Number.isInteger(neededStars))) {
      setResponseStatus(event, 400)
      return { error: 'Needed stars must be a positive integer' }
    }

    if (currentStars !== undefined && (typeof currentStars !== 'number' || currentStars < 0 || !Number.isInteger(currentStars))) {
      setResponseStatus(event, 400)
      return { error: 'Current stars must be a non-negative integer' }
    }

    if ((currentStars as number) > (neededStars as number)) {
      setResponseStatus(event, 400)
      return { error: 'Current stars cannot exceed needed stars' }
    }

    const isLearned = (currentStars as number) >= (neededStars as number)

    const [row] = await db.insert(spell).values({
      name: name.trim(),
      neededStars,
      currentStars,
      isLearned,
      updatedAt: new Date().toISOString()
    }).returning()

    setResponseStatus(event, 201)
    return row
  } catch (error) {
    const e = error as { code?: string; cause?: { code?: string } }
    if (e?.code === '23505' || e?.cause?.code === '23505') {
      setResponseStatus(event, 409)
      return { error: 'A spell with this name already exists' }
    }
    return handleUnknownError(event, 'creating spell', error)
  }
})
