import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { scheduledTask } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { parseId } from '../../../utils/parseId.js'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid task ID' }
    }

    const body = (await readBody(event) ?? {}) as { notes?: string | null }
    const notes = body.notes ?? null

    const [existing] = await db.select().from(scheduledTask).where(eq(scheduledTask.id, id))
    if (!existing) {
      setResponseStatus(event, 404)
      return { error: 'Task not found' }
    }

    const [updated] = await db.update(scheduledTask)
      .set({ notes, updatedAt: new Date().toISOString() })
      .where(eq(scheduledTask.id, id))
      .returning()

    return { task: { id: updated!.id, notes: updated!.notes } }
  } catch (error) {
    return handleUnknownError(event, 'updating task notes', error)
  }
})
