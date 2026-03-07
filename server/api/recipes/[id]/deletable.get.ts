import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { parseId } from '../../../utils/parseId.js'
import { potion, potionInventoryItem } from '../../../db/index.js'
import { eq, inArray } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid recipe ID' }
    }

    const potionsForRecipe = await db.select().from(potion).where(eq(potion.recipeId, id))
    const potionIds = potionsForRecipe.map(p => p.id)

    let canDelete = true
    if (potionIds.length > 0) {
      const potionsInInventory = await db.select().from(potionInventoryItem)
        .where(inArray(potionInventoryItem.potionId, potionIds))
      canDelete = potionsInInventory.length === 0
    }

    return {
      canDelete,
      reason: canDelete ? null : 'Has associated potions'
    }
  } catch (error) {
    return handleUnknownError(event, 'checking recipe deletability', error)
  }
})
