import { Router } from 'express'
import { prisma } from '../../db.js'
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

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'Currency name must be a non-empty string' })
    }

    // Validate value if provided
    if (value !== undefined && (typeof value !== 'number' || value < 0)) {
      return res.status(400).json({ error: 'Currency value must be a non-negative number' })
    }

    const currency = await prisma.currency.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(value !== undefined && { value })
      }
    })

    res.json(currency)
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Currency not found' })
    }
    handleUnknownError(res, 'updating currency in inventory', error)
  }
})

export default router
