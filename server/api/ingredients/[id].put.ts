import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { ingredient } from '../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid ingredient ID' }
    }

    const { name, description, secured } = await readBody<Record<string, unknown>>(event) ?? {}

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        setResponseStatus(event, 400)
        return { error: 'Ingredient name is required' }
      }
    }

    // Validate description if provided
    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim() === '') {
        setResponseStatus(event, 400)
        return { error: 'Description must be a non-empty string' }
      }
    }

    // Validate secured if provided
    if (secured !== undefined && typeof secured !== 'boolean') {
      setResponseStatus(event, 400)
      return { error: 'Secured must be a boolean' }
    }

    // Build update data object
    const updateData: {
      name?: string
      description?: string
      secured?: boolean
      updatedAt: string
    } = { updatedAt: new Date().toISOString() }

    if (name !== undefined) {
      updateData.name = (name as string).trim()
    }
    if (description !== undefined) {
      updateData.description = (description as string).trim()
    }
    if (secured !== undefined) {
      updateData.secured = secured as boolean
    }

    const [row] = await db.update(ingredient).set(updateData).where(eq(ingredient.id, id)).returning()
    if (!row) {
      setResponseStatus(event, 404)
      return { error: 'Ingredient not found' }
    }

    return row
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = String((error as { message: unknown }).message)
      if (errorMessage.includes('must not be null') || (errorMessage.includes('Argument') && errorMessage.includes('must not be null'))) {
        setResponseStatus(event, 400)
        return { error: 'Invalid data: required fields cannot be null' }
      }
    }
    return handleUnknownError(event, 'updating ingredient', error)
  }
})
