import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid ingredient ID' })
    }

    const { name, description, secured } = req.body

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Ingredient name is required' })
      }
    }

    // Validate description if provided
    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ error: 'Description must be a non-empty string' })
      }
    }

    // Validate secured if provided
    if (secured !== undefined && typeof secured !== 'boolean') {
      return res.status(400).json({ error: 'Secured must be a boolean' })
    }

    // Build update data object
    const updateData: {
      name?: string
      description?: string
      secured?: boolean
    } = {}

    if (name !== undefined) {
      updateData.name = name.trim()
    }
    if (description !== undefined) {
      updateData.description = description.trim()
    }
    if (secured !== undefined) {
      updateData.secured = secured
    }

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: updateData
    })

    return res.json(ingredient)
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Ingredient not found' })
    }
    // Handle Prisma validation errors (e.g., null values for non-nullable fields)
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = String(error.message)
      if (errorMessage.includes('must not be null') || (errorMessage.includes('Argument') && errorMessage.includes('must not be null'))) {
        return res.status(400).json({ error: 'Invalid data: required fields cannot be null' })
      }
    }
    handleUnknownError(res, 'updating ingredient', error)
  }
})

export default router
