import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'


const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { name } = req.body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Skill name is required' })
    }

    const skill = await prisma.skill.create({
      data: { name: name.trim() }
    })

    res.status(201).json(skill)
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return res.status(409).json({ error: 'A skill with this name already exists' })
    }
    handleUnknownError(res, 'creating skill', error)
  }
})

export default router
