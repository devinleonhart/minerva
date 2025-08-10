import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { ingredientId, quantity = 1 } = req.body

    if (!ingredientId) {
      res.status(400).json({ error: 'ingredientId is required' })
      return
    }

    // Check if ingredient exists
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId }
    })

    if (!ingredient) {
      res.status(404).json({ error: 'Ingredient not found' })
      return
    }

    // Check if item already exists in inventory
    const existingItem = await prisma.inventoryItem.findFirst({
      where: { ingredientId }
    })

    if (existingItem) {
      // Update quantity if item already exists
      const updatedItem = await prisma.inventoryItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      })
      res.json(updatedItem)
      return
    }

    // Create new inventory item
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        ingredientId,
        quantity,
        quality: 'NORMAL'
      },
      include: {
        ingredient: true
      }
    })

    res.json(inventoryItem)
  } catch (error) {
    handleUnknownError(res, 'creating inventory item', error)
  }
})

export default router
