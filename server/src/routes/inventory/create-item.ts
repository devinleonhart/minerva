import { Router } from 'express'
import { db } from '../../db.js'
import { item, itemInventoryItem } from '../../../db/index.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, description, quantity = 1 } = req.body

    if (!name || !description) {
      res.status(400).json({ error: 'name and description are required' })
      return
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      res.status(400).json({ error: 'quantity must be a positive integer' })
      return
    }

    const [newItem] = await db.insert(item).values({
      name,
      description,
      updatedAt: new Date().toISOString()
    }).returning()

    const [invItem] = await db.insert(itemInventoryItem).values({
      itemId: newItem.id,
      quantity,
      updatedAt: new Date().toISOString()
    }).returning()

    res.status(201).json({ ...invItem, item: newItem })
  } catch (error) {
    handleUnknownError(res, 'creating item in inventory', error)
  }
})

export default router
