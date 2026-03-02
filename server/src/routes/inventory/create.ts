import { Router } from 'express'
import { db } from '../../db.js'
import { ingredient, inventoryItem } from '../../../db/index.js'
import { eq, and } from 'drizzle-orm'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { ingredientId, quantity = 1, quality = 'NORMAL' } = req.body

    if (!ingredientId) {
      return res.status(400).json({ error: 'ingredientId is required' })
    }

    if (quality !== undefined && (
      quality === null ||
      quality === '' ||
      typeof quality !== 'string' ||
      !['NORMAL', 'HQ', 'LQ'].includes(quality)
    )) {
      return res.status(400).json({ error: 'Invalid quality. Must be NORMAL, HQ, or LQ' })
    }

    if (quantity !== undefined && (quantity < 0 || !Number.isInteger(quantity))) {
      return res.status(400).json({ error: 'Quantity must be a non-negative integer' })
    }

    const [ing] = await db.select().from(ingredient).where(eq(ingredient.id, ingredientId))
    if (!ing) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }

    const [existing] = await db.select().from(inventoryItem)
      .where(and(eq(inventoryItem.ingredientId, ingredientId), eq(inventoryItem.quality, quality)))

    if (existing) {
      const [updated] = await db.update(inventoryItem)
        .set({ quantity: existing.quantity + quantity, updatedAt: new Date().toISOString() })
        .where(eq(inventoryItem.id, existing.id))
        .returning()
      return res.json({ ...updated, ingredient: ing })
    }

    const [created] = await db.insert(inventoryItem).values({
      ingredientId,
      quantity,
      quality,
      updatedAt: new Date().toISOString()
    }).returning()

    return res.status(201).json({ ...created, ingredient: ing })
  } catch (error) {
    handleUnknownError(res, 'creating inventory item', error)
  }
})

export default router
