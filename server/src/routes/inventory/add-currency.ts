import { Router } from 'express'
import { db } from '../../db.js'
import { currency } from '../../../db/index.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, value } = req.body

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Currency name is required and must be a string' })
    }

    if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
      return res.status(400).json({ error: 'Currency value must be a non-negative integer' })
    }

    const [created] = await db.insert(currency).values({
      name,
      value,
      updatedAt: new Date().toISOString()
    }).returning()

    res.status(201).json(created)
  } catch (error) {
    const e = error as { code?: string; cause?: { code?: string } }
    if (e?.code === '23505' || e?.cause?.code === '23505') {
      return res.status(409).json({ error: 'A currency with this name already exists' })
    }
    handleUnknownError(res, 'adding currency to inventory', error)
  }
})

export default router
