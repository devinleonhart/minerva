import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { parseId } from '../../../utils/parseId.js'
import { potionInventoryItem, potion, recipe } from '../../../db/index.js'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))

    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid ID' }
    }

    const { quantity } = await readBody<Record<string, unknown>>(event) ?? {}

    if (typeof quantity !== 'number' || quantity < 0) {
      setResponseStatus(event, 400)
      return { error: 'Quantity must be a non-negative number' }
    }

    if (quantity === 0) {
      await db.delete(potionInventoryItem).where(eq(potionInventoryItem.id, id))
      return { message: 'Potion removed from inventory' }
    }

    const [updated] = await db.update(potionInventoryItem)
      .set({ quantity: quantity as number, updatedAt: new Date().toISOString() })
      .where(eq(potionInventoryItem.id, id))
      .returning()

    const [potionRow] = await db.select().from(potion).where(eq(potion.id, updated!.potionId))
    const [recipeRow] = await db.select().from(recipe).where(eq(recipe.id, potionRow!.recipeId))

    return { ...updated!, potion: { ...potionRow, recipe: recipeRow } }
  } catch (error) {
    return handleUnknownError(event, 'updating potion inventory', error)
  }
})
