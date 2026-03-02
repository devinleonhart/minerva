import { Router } from 'express'
import { db } from '../../db.js'
import { person } from '../../../db/index.js'
import { eq, asc, desc } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid person ID' })
    }

    const [row] = await db.select().from(person).where(eq(person.id, id))
    if (!row) {
      return res.status(404).json({ error: 'Person not found' })
    }

    return res.json(row)
  } catch (error) {
    handleUnknownError(res, 'fetching person', error)
  }
})

router.get('/', async (req, res) => {
  try {
    const people = await db.select().from(person).orderBy(desc(person.isFavorited), asc(person.name))
    return res.json(people)
  } catch (error) {
    handleUnknownError(res, 'fetching people', error)
  }
})

export default router
