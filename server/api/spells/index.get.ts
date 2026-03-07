import { eventHandler } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { spell } from '../../db/index.js'
import { asc, desc } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const spells = await db.select().from(spell).orderBy(desc(spell.isLearned), asc(spell.name))
    return spells
  } catch (error) {
    return handleUnknownError(event, 'fetching spells', error)
  }
})
