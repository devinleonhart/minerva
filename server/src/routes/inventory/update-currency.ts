import { Router } from 'express'
import { db } from '../../db.js'
import { currency } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'

const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid currency ID' })
      return
    }

    const { name, value } = req.body

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'Currency name must be a non-empty string' })
    }

    if (value !== undefined && (typeof value !== 'number' || value < 0)) {
      return res.status(400).json({ error: 'Currency value must be a non-negative number' })
    }

    const updateData: { name?: string; value?: number; updatedAt: string } = {
      updatedAt: new Date().toISOString()
    }
    if (name !== undefined) updateData.name = name.trim()
    if (value !== undefined) updateData.value = value

    const [updated] = await db.update(currency)
      .set(updateData)
      .where(eq(currency.id, id))
      .returning()

    if (!updated) {
      return res.status(404).json({ error: 'Currency not found' })
    }

    res.json(updated)
  } catch (error) {
    handleUnknownError(res, 'updating currency in inventory', error)
  }
})

export default router
