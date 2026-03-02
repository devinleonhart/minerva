import { Router } from 'express'
import { db } from '../../db.js'
import { potion } from '../../../db/index.js'
import { desc } from 'drizzle-orm'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/', async (req, res) => {
  try {
    const potions = await db.select().from(potion).orderBy(desc(potion.id))

    // Fetch recipe information for each potion separately
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

    return res.json(potionsWithRecipes)
  } catch (error) {
    handleUnknownError(res, 'fetching potions', error)
  }
})

export default router
