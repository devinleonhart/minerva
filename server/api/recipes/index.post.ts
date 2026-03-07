import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { recipe, recipeIngredient, ingredient } from '../../db/index.js'
import { inArray } from 'drizzle-orm'

interface RecipeIngredientInput {
  ingredientId: number
  quantity: number
}

export default eventHandler(async (event) => {
  try {
    const { name, description, ingredients } = (await readBody(event) ?? {}) as {
      name: string
      description: string
      ingredients: RecipeIngredientInput[]
    }

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      setResponseStatus(event, 400)
      return { error: 'Recipe name is required' }
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      setResponseStatus(event, 400)
      return { error: 'Recipe description is required' }
    }

    if (!ingredients || !Array.isArray(ingredients)) {
      setResponseStatus(event, 400)
      return { error: 'Ingredients array is required' }
    }

    if (ingredients.length === 0) {
      setResponseStatus(event, 400)
      return { error: 'Recipe must have at least one ingredient' }
    }

    // Check for duplicate ingredients
    const ingredientIds = ingredients.map((ing: RecipeIngredientInput) => ing.ingredientId)
    const uniqueIngredientIds = [...new Set(ingredientIds)]

    if (ingredientIds.length !== uniqueIngredientIds.length) {
      setResponseStatus(event, 400)
      return { error: 'Recipe cannot contain duplicate ingredients' }
    }

    // Verify all ingredients exist
    const existingIngredients = await db.select().from(ingredient).where(inArray(ingredient.id, uniqueIngredientIds))

    if (existingIngredients.length !== uniqueIngredientIds.length) {
      setResponseStatus(event, 400)
      return { error: 'One or more ingredients not found' }
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
            recipeId: createdRecipe!.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity || 1
          })
        )
      )

      return createdRecipe
    })

    // Fetch the created recipe with ingredients
    const recipeWithIngredients = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, newRecipe!.id),
      with: {
        ingredients: {
          with: { ingredient: true }
        }
      }
    })

    setResponseStatus(event, 201)
    return recipeWithIngredients
  } catch (error) {
    return handleUnknownError(event, 'creating recipe', error)
  }
})
