import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { parseId } from '../../../utils/parseId.js'
import { currency } from '../../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid currency ID' }
    }

    const { name, value } = await readBody<Record<string, unknown>>(event) ?? {}

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      setResponseStatus(event, 400)
      return { error: 'Currency name must be a non-empty string' }
    }

    if (value !== undefined && (typeof value !== 'number' || value < 0)) {
      setResponseStatus(event, 400)
      return { error: 'Currency value must be a non-negative number' }
    }

    const updateData: { name?: string; value?: number; updatedAt: string } = {
      updatedAt: new Date().toISOString()
    }
    if (name !== undefined) updateData.name = (name as string).trim()
    if (value !== undefined) updateData.value = value as number

    const [updated] = await db.update(currency)
      .set(updateData)
      .where(eq(currency.id, id))
      .returning()

    if (!updated) {
      setResponseStatus(event, 404)
      return { error: 'Currency not found' }
    }

    return updated
  } catch (error) {
    return handleUnknownError(event, 'updating currency in inventory', error)
  }
})
