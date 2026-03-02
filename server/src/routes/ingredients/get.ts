import { Router } from 'express'
import { db } from '../../db.js'
import { ingredient } from '../../../db/index.js'
import { eq, asc } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      return res.status(400).json({ error: 'Invalid ingredient ID' })
    }

    const [row] = await db.select().from(ingredient).where(eq(ingredient.id, id))
    if (!row) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }

    return res.json(row)
  } catch (error) {
    handleUnknownError(res, 'fetching ingredient', error)
  }
})

router.get('/', async (req, res) => {
  try {
    const ingredients = await db.select().from(ingredient).orderBy(asc(ingredient.name))
    return res.json(ingredients)
  } catch (error) {
    handleUnknownError(res, 'fetching ingredients', error)
  }
})

export default router
