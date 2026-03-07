import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { person } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid person ID' }
    }

    const { name, description, relationship, notableEvents, url, isFavorited } = await readBody<Record<string, unknown>>(event) ?? {}

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
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

    const updateData: {
      name?: string
      description?: string | null
      relationship?: string | null
      notableEvents?: string | null
      url?: string | null
      isFavorited?: boolean
      updatedAt: string
    } = { updatedAt: new Date().toISOString() }

    if (name !== undefined) {
      updateData.name = (name as string).trim()
    }
    if (description !== undefined) {
      updateData.description = (description as string | null | undefined)?.trim() || null
    }
    if (relationship !== undefined) {
      updateData.relationship = (relationship as string | null | undefined)?.trim() || null
    }
    if (notableEvents !== undefined) {
      updateData.notableEvents = (notableEvents as string | null | undefined)?.trim() || null
    }
    if (url !== undefined) {
      updateData.url = (url as string | null | undefined)?.trim() || null
    }
    if (isFavorited !== undefined) {
      updateData.isFavorited = isFavorited as boolean
    }

    const [row] = await db.update(person).set(updateData).where(eq(person.id, id)).returning()
    if (!row) {
      setResponseStatus(event, 404)
      return { error: 'Person not found' }
    }

    return row
  } catch (error) {
    return handleUnknownError(event, 'updating person', error)
  }
})
