import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid spell ID' })
      return
    }

    const spell = await prisma.spell.findUnique({ where: { id } })
    if (!spell) {
      res.status(404).json({ error: 'Spell not found' })
      return
    }

    res.json(spell)
  } catch (error) {
    handleUnknownError(res, 'fetching spell', error)
  }
})

router.get('/', async (req, res) => {
  try {
    const spells = await prisma.spell.findMany({
      orderBy: [
        { isLearned: 'desc' },
        { name: 'asc' }
      ]
    })

    res.json(spells)
  } catch (error) {
    handleUnknownError(res, 'fetching spells', error)
  }
})

export default router
