import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { item, itemInventoryItem } from '../../../db/index.js'

export default eventHandler(async (event) => {
  try {
    const body = await readBody<Record<string, unknown>>(event) ?? {}
    const { name, description, quantity = 1 } = body

    if (!name || !description) {
      setResponseStatus(event, 400)
      return { error: 'name and description are required' }
    }

    if ((quantity as number) < 1 || !Number.isInteger(quantity)) {
      setResponseStatus(event, 400)
      return { error: 'quantity must be a positive integer' }
    }

    const [newItem] = await db.insert(item).values({
      name: name as string,
      description: description as string,
      updatedAt: new Date().toISOString()
    }).returning()

    const [invItem] = await db.insert(itemInventoryItem).values({
      itemId: newItem!.id,
      quantity: quantity as number,
      updatedAt: new Date().toISOString()
    }).returning()

    setResponseStatus(event, 201)
    return { ...invItem!, item: newItem! }
  } catch (error) {
    return handleUnknownError(event, 'creating item in inventory', error)
  }
})
