import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { ingredient } from '../../db/index.js'

export default eventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event) ?? {}
  const { name, description, secured = false } = body

  // Validate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    setResponseStatus(event, 400)
    return { error: 'Ingredient name is required' }
  }

  // Validate description
  if (!description || typeof description !== 'string' || description.trim() === '') {
    setResponseStatus(event, 400)
    return { error: 'Ingredient description is required' }
  }

  try {
    const [row] = await db.insert(ingredient).values({
      name: (name as string).trim(),
      description: (description as string).trim(),
      secured: Boolean(secured),
      updatedAt: new Date().toISOString()
    }).returning()
    setResponseStatus(event, 201)
    return row
  } catch (error) {
    return handleUnknownError(event, 'creating ingredient', error)
  }
})
