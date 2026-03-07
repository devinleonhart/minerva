import { eventHandler } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { item } from '../../db/index.js'
import { asc } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const items = await db.select().from(item).orderBy(asc(item.name))
    return items
  } catch (error) {
    return handleUnknownError(event, 'fetching items', error)
  }
})
