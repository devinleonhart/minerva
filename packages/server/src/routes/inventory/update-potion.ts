import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)

    if (id === null) {
      res.status(400).json({ error: 'Invalid ID' })
      return
    }

    const { quantity } = req.body

    if (typeof quantity !== 'number' || quantity < 0) {
      res.status(400).json({ error: 'Quantity must be a non-negative number' })
      return
    }

    if (quantity === 0) {
      // Delete the inventory item if quantity is 0
      await prisma.potionInventoryItem.delete({
        where: { id }
      })
      res.json({ message: 'Potion removed from inventory' })
      return
    }

    const updatedItem = await prisma.potionInventoryItem.update({
      where: { id },
      data: { quantity },
      include: {
        potion: true
      }
    })

    // Fetch recipe information separately
    const recipe = await prisma.recipe.findUnique({
      where: { id: updatedItem.potion.recipeId }
    })

    const updatedItemWithRecipe = {
      ...updatedItem,
      potion: {
        ...updatedItem.potion,
        recipe: recipe
      }
    }

    res.json(updatedItemWithRecipe)
  } catch (error) {
    handleUnknownError(res, 'updating potion inventory', error)
  }
})

export default router
