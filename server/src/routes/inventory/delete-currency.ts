import { Router } from 'express'
import { db } from '../../db.js'
import { currency } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'

const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid currency ID' })
      return
    }

    const [deleted] = await db.delete(currency).where(eq(currency.id, id)).returning()

    if (!deleted) {
      return res.status(404).json({ error: 'Currency not found' })
    }

    res.status(204).send()
  } catch (error) {
    handleUnknownError(res, 'deleting currency from inventory', error)
  }
})

export default router
