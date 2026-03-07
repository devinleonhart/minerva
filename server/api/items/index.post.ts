import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { item, itemInventoryItem } from '../../db/index.js'

export default eventHandler(async (event) => {
  try {
    const { name, description } = await readBody<Record<string, unknown>>(event) ?? {}

    if (!name || typeof name !== 'string' || name.trim() === '') {
      setResponseStatus(event, 400)
      return { error: 'Item name is required' }
    }

    if (description !== undefined && typeof description !== 'string') {
      setResponseStatus(event, 400)
      return { error: 'Item description must be a string' }
    }

    const result = await db.transaction(async (tx) => {
      const [newItem] = await tx.insert(item).values({
        name: (name as string).trim(),
        description: (description as string | undefined)?.trim() || '',
        updatedAt: new Date().toISOString()
      }).returning()

      await tx.insert(itemInventoryItem).values({
        itemId: newItem!.id,
        quantity: 0,
        updatedAt: new Date().toISOString()
      })

      return newItem
    })

    const createdItem = await db.query.item.findFirst({
      where: (i, { eq }) => eq(i.id, result!.id),
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

    if (!createdItem) {
      setResponseStatus(event, 500)
      return { error: 'Failed to create item' }
    }
    const { itemInventoryItems, ...rest } = createdItem
    setResponseStatus(event, 201)
    return { ...rest, inventoryItems: itemInventoryItems }
  } catch (error) {
    return handleUnknownError(event, 'creating item', error)
  }
})
