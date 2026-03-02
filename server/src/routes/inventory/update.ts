import { Router } from 'express'
import { db } from '../../db.js'
import { inventoryItem, ingredient } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid inventory item ID' })
    }

    const { quality, quantity } = req.body

    const [existing] = await db.select().from(inventoryItem).where(eq(inventoryItem.id, id))
    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    if (quality !== undefined) {
      if (typeof quality !== 'string' || !['NORMAL', 'HQ', 'LQ'].includes(quality)) {
        return res.status(400).json({ error: 'Invalid quality. Must be NORMAL, HQ, or LQ' })
      }
    }

    if (quantity !== undefined && (quantity < 0 || !Number.isInteger(quantity))) {
      return res.status(400).json({ error: 'Quantity must be a non-negative integer' })
    }

    const updateData: {
      quality?: 'NORMAL' | 'HQ' | 'LQ'
      quantity?: number
      updatedAt: string
    } = { updatedAt: new Date().toISOString() }

    if (quality !== undefined) updateData.quality = quality as 'NORMAL' | 'HQ' | 'LQ'
    if (quantity !== undefined) updateData.quantity = quantity

    const [updated] = await db.update(inventoryItem)
      .set(updateData)
      .where(eq(inventoryItem.id, id))
      .returning()

    const [ing] = await db.select().from(ingredient).where(eq(ingredient.id, updated.ingredientId))

    return res.json({ ...updated, ingredient: ing })
  } catch (error) {
    handleUnknownError(res, 'updating inventory item', error)
  }
})

export default router
