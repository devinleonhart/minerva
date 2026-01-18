import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { ingredientId, quantity = 1, quality = 'NORMAL' } = req.body

    // Validate ingredientId
    if (!ingredientId) {
      return res.status(400).json({ error: 'ingredientId is required' })
    }

    // Validate quality
    if (quality !== undefined && (
      quality === null ||
      quality === '' ||
      typeof quality !== 'string' ||
      !['NORMAL', 'HQ', 'LQ'].includes(quality)
    )) {
      return res.status(400).json({ error: 'Invalid quality. Must be NORMAL, HQ, or LQ' })
    }

    // Validate quantity
    if (quantity !== undefined && (quantity < 0 || !Number.isInteger(quantity))) {
      return res.status(400).json({ error: 'Quantity must be a non-negative integer' })
    }

    // Check if ingredient exists
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId }
    })

    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }

    // Check if item already exists in inventory with the same quality
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        ingredientId,
        quality
      }
    })

    if (existingItem) {
      // Update quantity if item already exists with same quality
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: {
          ingredient: true
        }
      })
      return res.json(updatedItem)
    }

    // Create new inventory item
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        ingredientId,
        quantity,
        quality
      },
      include: {
        ingredient: true
      }
    })

    return res.status(201).json(inventoryItem)
  } catch (error) {
    handleUnknownError(res, 'creating inventory item', error)
  }
})

export default router
