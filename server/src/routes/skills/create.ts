import { Router } from 'express'
import { db } from '../../db.js'
import { skill } from '../../../db/index.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { name } = req.body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Skill name is required' })
    }

    const [row] = await db.insert(skill).values({
      name: name.trim(),
      updatedAt: new Date().toISOString()
    }).returning()

    return res.status(201).json(row)
  } catch (error) {
    const e = error as { code?: string; cause?: { code?: string } }
    if (e?.code === '23505' || e?.cause?.code === '23505') {
      return res.status(409).json({ error: 'A skill with this name already exists' })
    }
    handleUnknownError(res, 'creating skill', error)
  }
})

export default router
