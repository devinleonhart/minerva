import { Router } from 'express'
import { db } from '../../db.js'
import { potion, potionInventoryItem, recipe } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

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
    const [recipeRow] = await db.select().from(recipe).where(eq(recipe.id, recipeId))
    if (!recipeRow) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Create the potion directly without ingredient requirements
    const resultPotion = await db.transaction(async (tx) => {
      // Check if a potion with the same recipe and quality already exists
      const existingPotion = await tx.query.potion.findFirst({
        where: (p, { eq, and }) => and(eq(p.recipeId, recipeId), eq(p.quality, quality as 'NORMAL' | 'HQ' | 'LQ')),
        with: { inventoryItems: true }
      })

      type PotionInvItem = { id: number; quantity: number }
      if (existingPotion && (existingPotion.inventoryItems as PotionInvItem[]).length > 0) {
        // Potion exists, increment its inventory quantity
        const invItem = (existingPotion.inventoryItems as PotionInvItem[])[0]
        await tx.update(potionInventoryItem).set({
          quantity: invItem.quantity + 1,
          updatedAt: new Date().toISOString()
        }).where(eq(potionInventoryItem.id, invItem.id))
        return existingPotion
      } else {
        // Create new potion
        const [newPotion] = await tx.insert(potion).values({
          quality: quality as 'NORMAL' | 'HQ' | 'LQ',
          recipeId: recipeId,
          updatedAt: new Date().toISOString()
        }).returning()

        // Add potion to inventory
        await tx.insert(potionInventoryItem).values({
          potionId: newPotion.id,
          quantity: 1,
          updatedAt: new Date().toISOString()
        })

        return newPotion
      }
    })

    // Fetch the created potion with inventory items
    const potionWithInventory = await db.query.potion.findFirst({
      where: (p, { eq }) => eq(p.id, resultPotion.id),
      with: { inventoryItems: true }
    })

    if (!potionWithInventory) {
      return res.status(500).json({ error: 'Failed to create potion' })
    }

    return res.status(201).json(potionWithInventory)
  } catch (error) {
    handleUnknownError(res, 'creating potion directly', error)
  }
})

export default router
