import { Router } from 'express'
import { db } from '../../db.js'
import { skill } from '../../../db/index.js'
import { eq, asc } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid skill ID' })
    }

    const [row] = await db.select().from(skill).where(eq(skill.id, id))
    if (!row) {
      return res.status(404).json({ error: 'Skill not found' })
    }

    return res.json(row)
  } catch (error) {
    handleUnknownError(res, 'fetching skill', error)
  }
})

router.get('/', async (req, res) => {
  try {
    const skills = await db.select().from(skill).orderBy(asc(skill.name))
    return res.json(skills)
  } catch (error) {
    handleUnknownError(res, 'fetching skills', error)
  }
})

export default router
