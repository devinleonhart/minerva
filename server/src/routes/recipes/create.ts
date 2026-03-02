import { Router } from 'express'
import { db } from '../../db.js'
import { recipe, recipeIngredient, ingredient } from '../../../db/index.js'
import { inArray } from 'drizzle-orm'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

interface RecipeIngredientInput {
  ingredientId: number
  quantity: number
}

const router: Router = Router()

router.post('/', async (req, res) => {
  try {
    const { name, description, ingredients } = req.body as {
      name: string
      description: string
      ingredients: RecipeIngredientInput[]
    }

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Recipe name is required' })
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return res.status(400).json({ error: 'Recipe description is required' })
    }

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'Ingredients array is required' })
    }

    if (ingredients.length === 0) {
      return res.status(400).json({ error: 'Recipe must have at least one ingredient' })
    }

    // Check for duplicate ingredients
    const ingredientIds = ingredients.map((ing: RecipeIngredientInput) => ing.ingredientId)
    const uniqueIngredientIds = [...new Set(ingredientIds)]

    if (ingredientIds.length !== uniqueIngredientIds.length) {
      return res.status(400).json({ error: 'Recipe cannot contain duplicate ingredients' })
    }

    // Verify all ingredients exist
    const existingIngredients = await db.select().from(ingredient).where(inArray(ingredient.id, uniqueIngredientIds))

    if (existingIngredients.length !== uniqueIngredientIds.length) {
      return res.status(400).json({ error: 'One or more ingredients not found' })
    }

    // Create recipe with ingredients in a transaction
    const newRecipe = await db.transaction(async (tx) => {
      // Create the recipe
      const [createdRecipe] = await tx.insert(recipe).values({
        name: name.trim(),
        description: description.trim(),
        updatedAt: new Date().toISOString()
      }).returning()

      // Create recipe-ingredient relationships with quantities
      await Promise.all(
        ingredients.map((ing: RecipeIngredientInput) =>
          tx.insert(recipeIngredient).values({
            recipeId: createdRecipe.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity || 1
          })
        )
      )

      return createdRecipe
    })

    // Fetch the created recipe with ingredients
    const recipeWithIngredients = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, newRecipe.id),
      with: {
        ingredients: {
          with: { ingredient: true }
        }
      }
    })

    return res.status(201).json(recipeWithIngredients)
  } catch (error) {
    handleUnknownError(res, 'creating recipe', error)
  }
})

export default router
