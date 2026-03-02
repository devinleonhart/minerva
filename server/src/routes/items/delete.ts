import { Router } from 'express'
import { db } from '../../db.js'
import { item, itemInventoryItem } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid item ID' })
    }

    const existingInventoryItems = await db.select().from(itemInventoryItem).where(eq(itemInventoryItem.itemId, id))

    if (existingInventoryItems.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete item that has inventory items',
        inventoryItemCount: existingInventoryItems.length
      })
    }

    const [row] = await db.delete(item).where(eq(item.id, id)).returning()
    if (!row) {
      return res.status(404).json({ error: 'Item not found' })
    }
    return res.status(204).send()
  } catch (error) {
    handleUnknownError(res, 'deleting item', error)
  }
})

export default router
