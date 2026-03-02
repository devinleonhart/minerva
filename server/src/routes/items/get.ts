import { Router } from 'express'
import { db } from '../../db.js'
import { item } from '../../../db/index.js'
import { eq, asc } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid item ID' })
    }

    const [row] = await db.select().from(item).where(eq(item.id, id))
    if (!row) {
      return res.status(404).json({ error: 'Item not found' })
    }

    return res.json(row)
  } catch (error) {
    handleUnknownError(res, 'fetching item', error)
  }
})

router.get('/', async (req, res) => {
  try {
    const items = await db.select().from(item).orderBy(asc(item.name))
    return res.json(items)
  } catch (error) {
    handleUnknownError(res, 'fetching items', error)
  }
})

export default router
