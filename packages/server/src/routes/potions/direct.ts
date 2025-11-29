import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import type { PrismaClient } from '../../generated/client.js'

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>

const router: Router = Router()

interface DirectPotionRequest {
  recipeId: number
  quality?: string
}

router.post('/', async (req, res) => {
  try {
    const { recipeId, quality = 'NORMAL' } = req.body as DirectPotionRequest

    // Validate quality
    if (quality !== undefined && (
      quality === null ||
      quality === '' ||
      typeof quality !== 'string' ||
      !['NORMAL', 'HQ', 'LQ'].includes(quality)
    )) {
      return res.status(400).json({ error: 'Invalid quality. Must be NORMAL, HQ, or LQ' })
    }

    if (!recipeId) {
      return res.status(400).json({ error: 'recipeId is required' })
    }

    // Verify recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    })

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Create the potion directly without ingredient requirements
    const potion = await prisma.$transaction(async (tx: TransactionClient) => {
      // Create the potion
      const newPotion = await tx.potion.create({
        data: {
          quality: quality as 'NORMAL' | 'HQ' | 'LQ',
          recipeId: recipeId
        }
      })

      // Add potion to inventory
      await tx.potionInventoryItem.create({
        data: {
          potionId: newPotion.id,
          quantity: 1
        }
      })

      return newPotion
    })

    // Fetch the created potion with recipe details
    const potionWithRecipe = await prisma.potion.findUnique({
      where: { id: potion.id },
      include: {
        inventoryItems: true
      }
    })

    if (!potionWithRecipe) {
      return res.status(500).json({ error: 'Failed to create potion' })
    }

    return res.status(201).json(potionWithRecipe)
  } catch (error) {
    handleUnknownError(res, 'creating potion directly', error)
  }
})

export default router
