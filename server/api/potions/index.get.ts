import { eventHandler } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { potion } from '../../db/index.js'
import { desc } from 'drizzle-orm'

export default eventHandler(async (event) => {
  try {
    const potions = await db.select().from(potion).orderBy(desc(potion.id))

    const potionsWithRecipes = await Promise.all(
      potions.map(async (p) => {
        const recipeRow = await db.query.recipe.findFirst({
          where: (r, { eq }) => eq(r.id, p.recipeId),
          with: {
            ingredients: {
              with: { ingredient: true }
            }
          }
        })

        return {
          ...p,
          recipe: recipeRow
        }
      })
    )

    return potionsWithRecipes
  } catch (error) {
    return handleUnknownError(event, 'fetching potions', error)
  }
})
