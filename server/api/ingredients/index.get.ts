import { eventHandler } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { ingredient } from '../../db/index.js'
import { asc } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const ingredients = await db.select().from(ingredient).orderBy(asc(ingredient.name))
    return ingredients
  } catch (error) {
    return handleUnknownError(event, 'fetching ingredients', error)
  }
})
