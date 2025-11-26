import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'

const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid spell ID' })
      return
    }

    await prisma.spell.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Spell not found' })
    }
    handleUnknownError(res, 'deleting spell', error)
  }
})

export default router
