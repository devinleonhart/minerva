import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { parseId } from '../../../utils/parseId.js'
import { spell } from '../../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const id = parseId(getRouterParam(event, 'id'))
  if (id === null) {
    setResponseStatus(event, 400)
    return { error: 'Invalid spell ID' }
  }
  try {
    const { currentStars } = await readBody<Record<string, unknown>>(event) ?? {}

    if (currentStars === undefined || currentStars === null || typeof currentStars !== 'number') {
      setResponseStatus(event, 400)
      return { error: 'Current stars is required and must be a number' }
    }

    if (!Number.isInteger(currentStars) || currentStars < 0) {
      setResponseStatus(event, 400)
      return { error: 'Current stars must be a non-negative integer' }
    }

    const [existing] = await db.select().from(spell).where(eq(spell.id, id))
    if (!existing) {
      setResponseStatus(event, 404)
      return { error: 'Spell not found' }
    }

    if (currentStars > existing.neededStars) {
      setResponseStatus(event, 400)
      return { error: 'Current stars cannot exceed needed stars' }
    }

    const isLearned = currentStars >= existing.neededStars

    const [row] = await db.update(spell)
      .set({ currentStars, isLearned, updatedAt: new Date().toISOString() })
      .where(eq(spell.id, id))
      .returning()

    return row
  } catch (error) {
    return handleUnknownError(event, 'updating spell progress', error)
  }
})
