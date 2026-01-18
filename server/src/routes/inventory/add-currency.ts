import { Router } from 'express'
import { prisma } from '../../db.js'
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

    const currency = await prisma.currency.create({
      data: {
        name,
        value
      }
    })

    res.status(201).json(currency)
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: 'A currency with this name already exists' })
    }
    handleUnknownError(res, 'adding currency to inventory', error)
  }
})

export default router
