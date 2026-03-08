import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { person, personNotableEvent } from '../../db/index.js'

export default eventHandler(async (event) => {
  try {
    const { name, description, relationship, notableEvents, url, isFavorited = false } = await readBody<Record<string, unknown>>(event) ?? {}

    if (!name || typeof name !== 'string' || name.trim() === '') {
      setResponseStatus(event, 400)
      return { error: 'Person name is required' }
    }

    if (description !== undefined && typeof description !== 'string' && description !== null) {
      setResponseStatus(event, 400)
      return { error: 'Description must be a string or null' }
    }

    if (relationship !== undefined && typeof relationship !== 'string' && relationship !== null) {
      setResponseStatus(event, 400)
      return { error: 'Relationship must be a string or null' }
    }

    if (notableEvents !== undefined && !Array.isArray(notableEvents)) {
      setResponseStatus(event, 400)
      return { error: 'Notable events must be an array' }
    }

    if (Array.isArray(notableEvents) && notableEvents.some((e: unknown) => typeof e !== 'string' || e.trim() === '')) {
      setResponseStatus(event, 400)
      return { error: 'Each notable event must be a non-empty string' }
    }

    if (url !== undefined && typeof url !== 'string' && url !== null) {
      setResponseStatus(event, 400)
      return { error: 'URL must be a string or null' }
    }

    if (isFavorited !== undefined && typeof isFavorited !== 'boolean') {
      setResponseStatus(event, 400)
      return { error: 'isFavorited must be a boolean' }
    }

    const [row] = await db.insert(person).values({
      name: (name as string).trim(),
      description: (description as string | null | undefined)?.trim() || null,
      relationship: (relationship as string | null | undefined)?.trim() || null,
      url: (url as string | null | undefined)?.trim() || null,
      isFavorited: Boolean(isFavorited),
      updatedAt: new Date().toISOString()
    }).returning()

    if (Array.isArray(notableEvents) && notableEvents.length > 0) {
      await db.insert(personNotableEvent).values(
        (notableEvents as string[]).map(e => ({
          personId: row!.id,
          description: e.trim(),
          updatedAt: new Date().toISOString()
        }))
      )
    }

    const result = await db.query.person.findFirst({
      where: (p, { eq }) => eq(p.id, row!.id),
      with: { notableEvents: true }
    })

    setResponseStatus(event, 201)
    return result
  } catch (error) {
    return handleUnknownError(event, 'creating person', error)
  }
})
