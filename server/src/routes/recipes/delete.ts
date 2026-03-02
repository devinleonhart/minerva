import { Router } from 'express'
import { db } from '../../db.js'
import { recipe, recipeIngredient } from '../../../db/index.js'
import { eq } from 'drizzle-orm'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)

    if (id === null) {
      return res.status(400).json({ error: 'Invalid recipe ID' })
    }

    const existingRecipe = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, id)
    })

    if (!existingRecipe) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Check if recipe has potions that are currently in inventory
    const potionsInInventory = await db.query.potionInventoryItem.findMany({
      with: { potion: true },
      where: (pii, { sql }) => sql`${pii.potionId} IN (SELECT id FROM "Potion" WHERE "recipeId" = ${id})`
    })

    if (potionsInInventory.length > 0) {
      return res.status(400).json({ error: 'Cannot delete recipe because potions are in inventory' })
    }

    // Delete recipe with ingredients in a transaction
    await db.transaction(async (tx) => {
      // Delete recipe-ingredient relationships first
      await tx.delete(recipeIngredient).where(eq(recipeIngredient.recipeId, id))

      // Delete the recipe
      await tx.delete(recipe).where(eq(recipe.id, id))
    })

    return res.status(204).send()
  } catch (error) {
    handleUnknownError(res, 'deleting recipe', error)
  }
})

export default router
