import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../../utils/db.js'
import { handleUnknownError } from '../../../utils/handleUnknownError.js'
import { parseId } from '../../../utils/parseId.js'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid ingredient ID' }
    }

    const recipeUsage = await db.query.recipeIngredient.findFirst({
      where: (ri, { eq }) => eq(ri.ingredientId, id)
    })

    const inventoryUsage = await db.query.inventoryItem.findFirst({
      where: (inv, { eq }) => eq(inv.ingredientId, id)
    })

    const canDelete = !recipeUsage && !inventoryUsage

    return {
      canDelete,
      reason: canDelete ? null : recipeUsage ? 'Used in recipes' : 'Has inventory items'
    }
  } catch (error) {
    return handleUnknownError(event, 'checking ingredient deletability', error)
  }
})
