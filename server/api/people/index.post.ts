import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { person } from '../../db/index.js'

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

    if (notableEvents !== undefined && typeof notableEvents !== 'string' && notableEvents !== null) {
      setResponseStatus(event, 400)
      return { error: 'Notable events must be a string or null' }
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
      notableEvents: (notableEvents as string | null | undefined)?.trim() || null,
      url: (url as string | null | undefined)?.trim() || null,
      isFavorited: Boolean(isFavorited),
      updatedAt: new Date().toISOString()
    }).returning()

    setResponseStatus(event, 201)
    return row
  } catch (error) {
    return handleUnknownError(event, 'creating person', error)
  }
})
