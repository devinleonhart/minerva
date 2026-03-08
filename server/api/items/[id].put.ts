import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { item } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid item ID' }
    }

    const { name, description } = await readBody<Record<string, unknown>>(event) ?? {}

    const [existing] = await db.select().from(item).where(eq(item.id, id))
    if (!existing) {
      setResponseStatus(event, 404)
      return { error: 'Item not found' }
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      setResponseStatus(event, 400)
      return { error: 'Item name is required' }
    }

    if (description !== undefined && typeof description !== 'string') {
      setResponseStatus(event, 400)
      return { error: 'Item description must be a string' }
    }

    const [updated] = await db.update(item).set({
      ...(name !== undefined && { name: (name as string).trim() }),
      ...(description !== undefined && { description: (description as string).trim() }),
      updatedAt: new Date().toISOString()
    }).where(eq(item.id, id)).returning()

    return updated
  } catch (error) {
    return handleUnknownError(event, 'updating item', error)
  }
})
