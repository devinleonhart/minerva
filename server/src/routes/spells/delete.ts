import { Router } from 'express'
import { db } from '../../db.js'
import { spell } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'

const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid spell ID' })
    }

    const [row] = await db.delete(spell).where(eq(spell.id, id)).returning()
    if (!row) {
      return res.status(404).json({ error: 'Spell not found' })
    }

    return res.status(204).send()
  } catch (error) {
    handleUnknownError(res, 'deleting spell', error)
  }
})

export default router
