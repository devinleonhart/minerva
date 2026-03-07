import { eventHandler } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { person } from '../../db/index.js'
import { asc, desc } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const people = await db.select().from(person).orderBy(desc(person.isFavorited), asc(person.name))
    return people
  } catch (error) {
    return handleUnknownError(event, 'fetching people', error)
  }
})
