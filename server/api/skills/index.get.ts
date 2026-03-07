import { eventHandler } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { skill } from '../../db/index.js'
import { asc } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const skills = await db.select().from(skill).orderBy(asc(skill.name))
    return skills
  } catch (error) {
    return handleUnknownError(event, 'fetching skills', error)
  }
})
