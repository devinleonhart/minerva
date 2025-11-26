import { Router } from 'express'
import { prisma } from '../../db.js'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid skill ID' })
      return
    }

    const skill = await prisma.skill.findUnique({ where: { id } })
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' })
      return
    }

    res.json(skill)
  } catch (error) {
    handleUnknownError(res, 'fetching skill', error)
  }
})

router.get('/', async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    res.json(skills)
  } catch (error) {
    handleUnknownError(res, 'fetching skills', error)
  }
})

export default router
