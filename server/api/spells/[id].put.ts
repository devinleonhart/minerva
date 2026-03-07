import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { spell } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid spell ID' }
    }

    const { name, neededStars, currentStars } = await readBody<Record<string, unknown>>(event) ?? {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        setResponseStatus(event, 400)
        return { error: 'Spell name must be a non-empty string' }
      }
      if (name.trim().length > 255) {
        setResponseStatus(event, 400)
        return { error: 'Spell name must be 255 characters or less' }
      }
    }

    if (neededStars !== undefined && (typeof neededStars !== 'number' || neededStars < 1 || !Number.isInteger(neededStars))) {
      setResponseStatus(event, 400)
      return { error: 'Needed stars must be a positive integer' }
    }

    if (currentStars !== undefined && (typeof currentStars !== 'number' || currentStars < 0 || !Number.isInteger(currentStars))) {
      setResponseStatus(event, 400)
      return { error: 'Current stars must be a non-negative integer' }
    }

    const [currentSpell] = await db.select().from(spell).where(eq(spell.id, id))
    if (!currentSpell) {
      setResponseStatus(event, 404)
      return { error: 'Spell not found' }
    }

    const newNeededStars = neededStars !== undefined ? neededStars as number : currentSpell.neededStars
    const rawCurrentStars = currentStars !== undefined ? currentStars as number : currentSpell.currentStars
    const newCurrentStars = Math.min(rawCurrentStars, newNeededStars)

    const isLearned = newCurrentStars >= newNeededStars

    const [row] = await db.update(spell).set({
      ...(name !== undefined && { name: (name as string).trim() }),
      neededStars: newNeededStars,
      currentStars: newCurrentStars,
      isLearned,
      updatedAt: new Date().toISOString()
    }).where(eq(spell.id, id)).returning()

    if (!row) {
      setResponseStatus(event, 404)
      return { error: 'Spell not found' }
    }

    return row
  } catch (error) {
    const e = error as { code?: string; cause?: { code?: string } }
    if (e?.code === '23505' || e?.cause?.code === '23505') {
      setResponseStatus(event, 409)
      return { error: 'A spell with this name already exists' }
    }
    return handleUnknownError(event, 'updating spell', error)
  }
})
