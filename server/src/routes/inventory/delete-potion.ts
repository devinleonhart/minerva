import { Router } from 'express'
import { db } from '../../db.js'
import { potionInventoryItem } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)

    if (id === null) {
      res.status(400).json({ error: 'Invalid ID' })
      return
    }

    await db.delete(potionInventoryItem).where(eq(potionInventoryItem.id, id))

    res.json({ message: 'Potion removed from inventory' })
  } catch (error) {
    handleUnknownError(res, 'deleting potion from inventory', error)
  }
})

export default router
