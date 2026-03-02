import { Router } from 'express'
import { db } from '../../db.js'
import { potionInventoryItem, potion, recipe } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req)

    if (id === null) {
      res.status(400).json({ error: 'Invalid ID' })
      return
    }

    const { quantity } = req.body

    if (typeof quantity !== 'number' || quantity < 0) {
      res.status(400).json({ error: 'Quantity must be a non-negative number' })
      return
    }

    if (quantity === 0) {
      await db.delete(potionInventoryItem).where(eq(potionInventoryItem.id, id))
      res.json({ message: 'Potion removed from inventory' })
      return
    }

    const [updated] = await db.update(potionInventoryItem)
      .set({ quantity, updatedAt: new Date().toISOString() })
      .where(eq(potionInventoryItem.id, id))
      .returning()

    const [potionRow] = await db.select().from(potion).where(eq(potion.id, updated.potionId))
    const [recipeRow] = await db.select().from(recipe).where(eq(recipe.id, potionRow.recipeId))

    res.json({ ...updated, potion: { ...potionRow, recipe: recipeRow } })
  } catch (error) {
    handleUnknownError(res, 'updating potion inventory', error)
  }
})

export default router
