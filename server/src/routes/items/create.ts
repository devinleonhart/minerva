import { Router } from 'express'
import { db } from '../../db.js'
import { item, itemInventoryItem } from '../../../db/index.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required' })
    }

    // Validate description - schema requires it, so we default to empty string if not provided
    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({ error: 'Item description must be a string' })
    }

    const result = await db.transaction(async (tx) => {
      const [newItem] = await tx.insert(item).values({
        name: name.trim(),
        description: description?.trim() || '',
        updatedAt: new Date().toISOString()
      }).returning()

      await tx.insert(itemInventoryItem).values({
        itemId: newItem.id,
        quantity: 0,
        updatedAt: new Date().toISOString()
      })

      return newItem
    })

    const createdItem = await db.query.item.findFirst({
      where: (i, { eq }) => eq(i.id, result.id),
      with: {
        itemInventoryItems: {
          columns: {
            id: true,
            quantity: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!createdItem) return res.status(500).json({ error: 'Failed to create item' })
    const { itemInventoryItems, ...rest } = createdItem
    return res.status(201).json({ ...rest, inventoryItems: itemInventoryItems })
  } catch (error) {
    handleUnknownError(res, 'creating item', error)
  }
})

export default router
