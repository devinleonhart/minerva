import { Router } from 'express'
import { db } from '../../db.js'
import { itemInventoryItem, item } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { quantity } = req.body

    if (quantity === undefined || quantity === null) {
      res.status(400).json({ error: 'quantity is required' })
      return
    }

    if (quantity < 0 || !Number.isInteger(quantity)) {
      res.status(400).json({ error: 'quantity must be a non-negative integer' })
      return
    }

    const [existing] = await db.select().from(itemInventoryItem)
      .where(eq(itemInventoryItem.id, parseInt(id)))

    if (!existing) {
      res.status(404).json({ error: 'Item inventory item not found' })
      return
    }

    const [updated] = await db.update(itemInventoryItem)
      .set({ quantity, updatedAt: new Date().toISOString() })
      .where(eq(itemInventoryItem.id, parseInt(id)))
      .returning()

    const [itemRow] = await db.select().from(item).where(eq(item.id, updated.itemId))

    res.json({ ...updated, item: itemRow })
  } catch (error) {
    handleUnknownError(res, 'updating item quantity', error)
  }
})

export default router
