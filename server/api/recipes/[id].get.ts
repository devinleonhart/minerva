import { eventHandler, getRouterParam, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid recipe ID' }
    }

    const recipeRow = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      with: {
        ingredients: {
          with: { ingredient: true }
        },
        cauldronVariants: {
          with: { essenceIngredient: true }
        }
      }
    })

    if (!recipeRow) {
      setResponseStatus(event, 404)
      return { error: 'Recipe not found' }
    }

    return recipeRow
  } catch (error) {
    return handleUnknownError(event, 'fetching recipe', error)
  }
})
