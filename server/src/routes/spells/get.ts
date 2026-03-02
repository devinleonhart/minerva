import { Router } from 'express'
import { db } from '../../db.js'
import { spell } from '../../../db/index.js'
import { eq, asc, desc } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid spell ID' })
    }

    const [row] = await db.select().from(spell).where(eq(spell.id, id))
    if (!row) {
      return res.status(404).json({ error: 'Spell not found' })
    }

    return res.json(row)
  } catch (error) {
    handleUnknownError(res, 'fetching spell', error)
  }
})

router.get('/', async (req, res) => {
  try {
    const spells = await db.select().from(spell).orderBy(desc(spell.isLearned), asc(spell.name))
    return res.json(spells)
  } catch (error) {
    handleUnknownError(res, 'fetching spells', error)
  }
})

export default router
