import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'

const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid skill ID' })
      return
    }

    await prisma.skill.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ error: 'Skill not found' })
    }
    handleUnknownError(res, 'deleting skill', error)
  }
})

export default router
