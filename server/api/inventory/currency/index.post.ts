import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { currency } from '../../../db/index.js'

export default eventHandler(async (event) => {
  try {
    const { name, value } = await readBody<Record<string, unknown>>(event) ?? {}

    if (!name || typeof name !== 'string') {
      setResponseStatus(event, 400)
      return { error: 'Currency name is required and must be a string' }
    }

    if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
      setResponseStatus(event, 400)
      return { error: 'Currency value must be a non-negative integer' }
    }

    const [created] = await db.insert(currency).values({
      name: name as string,
      value: value as number,
      updatedAt: new Date().toISOString()
    }).returning()

    setResponseStatus(event, 201)
    return created
  } catch (error) {
    const e = error as { code?: string; cause?: { code?: string } }
    if (e?.code === '23505' || e?.cause?.code === '23505') {
      setResponseStatus(event, 409)
      return { error: 'A currency with this name already exists' }
    }
    return handleUnknownError(event, 'adding currency to inventory', error)
  }
})
