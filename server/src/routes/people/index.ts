import { Router } from 'express'
import { db } from '../../db.js'
import { person } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import getRoutes from './get.js'
import createRoutes from './create.js'
import updateRoutes from './update.js'
import deleteRoutes from './delete.js'

const router: Router = Router()

router.use('/', getRoutes)
router.use('/', createRoutes)
router.use('/', updateRoutes)
router.use('/', deleteRoutes)

// Toggle favorite status
router.patch('/:id/favorite', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid person ID' })
    }

    const [row] = await db.select().from(person).where(eq(person.id, id))

    if (!row) {
      return res.status(404).json({ error: 'Person not found' })
    }

    const [updated] = await db.update(person)
      .set({ isFavorited: !row.isFavorited, updatedAt: new Date().toISOString() })
      .where(eq(person.id, id))
      .returning()

    return res.json(updated)
  } catch (error) {
    handleUnknownError(res, 'toggling person favorite status', error)
  }
})

export default router
