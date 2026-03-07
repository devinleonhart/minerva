import { eventHandler } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

export default eventHandler(async (event) => {
  try {
    const recipes = await db.query.recipe.findMany({
      with: {
        ingredients: {
          with: { ingredient: true }
        },
        cauldronVariants: {
          with: { essenceIngredient: true }
        }
      },
      orderBy: (r, { asc }) => [asc(r.name)]
    })

    return recipes
  } catch (error) {
    return handleUnknownError(event, 'fetching recipes', error)
  }
})
