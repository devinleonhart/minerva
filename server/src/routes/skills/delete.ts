import { Router } from 'express'
import { db } from '../../db.js'
import { skill } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'

const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid skill ID' })
    }

    const [row] = await db.delete(skill).where(eq(skill.id, id)).returning()
    if (!row) {
      return res.status(404).json({ error: 'Skill not found' })
    }

    return res.status(204).send()
  } catch (error) {
    handleUnknownError(res, 'deleting skill', error)
  }
})

export default router
