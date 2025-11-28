import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import type { PrismaClient } from '../../generated/client.js'

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>

const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)

    if (id === null) {
      res.status(400).json({ error: 'Invalid recipe ID' })
      return
    }

    const existingRecipe = await prisma.recipe.findUnique({
      where: { id }
    })

    if (!existingRecipe) {
      res.status(404).json({ error: 'Recipe not found' })
      return
    }

    // Check if recipe has potions that are currently in inventory
    const potionsInInventory = await prisma.potionInventoryItem.findMany({
      include: {
        potion: true
      },
      where: {
        potion: {
          recipeId: id
        }
      }
    })

    if (potionsInInventory.length > 0) {
      res.status(400).json({ error: 'Cannot delete recipe because potions are in inventory' })
      return
    }

    // Delete recipe with ingredients in a transaction
    await prisma.$transaction(async (tx: TransactionClient) => {
      // Delete recipe-ingredient relationships first
      await tx.recipeIngredient.deleteMany({
        where: { recipeId: id }
      })

      // Delete the recipe
      await tx.recipe.delete({
        where: { id }
      })
    })

    res.status(204).send()
  } catch (error) {
    handleUnknownError(res, 'deleting recipe', error)
  }
})

export default router
