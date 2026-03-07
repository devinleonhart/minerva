import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { skill } from '../../db/index.js'

export default eventHandler(async (event) => {
  try {
    const { name } = await readBody<Record<string, unknown>>(event) ?? {}

    if (!name || typeof name !== 'string' || name.trim() === '') {
      setResponseStatus(event, 400)
      return { error: 'Skill name is required' }
    }

    const [row] = await db.insert(skill).values({
      name: name.trim(),
      updatedAt: new Date().toISOString()
    }).returning()

    setResponseStatus(event, 201)
    return row
  } catch (error) {
    const e = error as { code?: string; cause?: { code?: string } }
    if (e?.code === '23505' || e?.cause?.code === '23505') {
      setResponseStatus(event, 409)
      return { error: 'A skill with this name already exists' }
    }
    return handleUnknownError(event, 'creating skill', error)
  }
})
