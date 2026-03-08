import { eventHandler } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

export default eventHandler(async (event) => {
  try {
    const people = await db.query.person.findMany({
      with: { notableEvents: true },
      orderBy: (p, { desc, asc }) => [desc(p.isFavorited), asc(p.name)]
    })
    return people
  } catch (error) {
    return handleUnknownError(event, 'fetching people', error)
  }
})
