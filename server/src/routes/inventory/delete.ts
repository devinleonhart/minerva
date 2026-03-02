import { Router } from 'express'
import { db } from '../../db.js'
import { inventoryItem } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid inventory item ID' })
    }

    const [existing] = await db.select().from(inventoryItem).where(eq(inventoryItem.id, id))
    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }

    await db.delete(inventoryItem).where(eq(inventoryItem.id, id))

    return res.status(204).send()
  } catch (error) {
    handleUnknownError(res, 'deleting inventory item', error)
  }
})

export default router
