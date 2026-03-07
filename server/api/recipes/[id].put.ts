import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { recipe, recipeIngredient, ingredient } from '../../db/index.js'
import { eq, inArray } from 'drizzle-orm'

interface RecipeIngredientInput {
  ingredientId: number
  quantity: number
}

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    const {
      name, description, ingredients,
      fireEssence, airEssence, waterEssence, lightningEssence, earthEssence, lifeEssence, deathEssence
    } = await readBody(event) as {
      name?: string
      description?: string
      ingredients?: RecipeIngredientInput[]
      fireEssence?: string | null
      airEssence?: string | null
      waterEssence?: string | null
      lightningEssence?: string | null
      earthEssence?: string | null
      lifeEssence?: string | null
      deathEssence?: string | null
    }

    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid recipe ID' }
    }

    const existingRecipe = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, id)
    })

    if (!existingRecipe) {
      setResponseStatus(event, 404)
      return { error: 'Recipe not found' }
    }

    // Update recipe with ingredients in a transaction
    try {
      await db.transaction(async (tx) => {
        // Validate name if provided
        if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
          throw new Error('Recipe name is required')
        }

        // Validate description if provided
        if (description !== undefined && (typeof description !== 'string' || description.trim() === '')) {
          throw new Error('Recipe description is required')
        }

        // Validate ingredients if provided
        if (ingredients !== undefined) {
          if (!Array.isArray(ingredients)) {
            throw new Error('Ingredients must be an array')
          }
          if (ingredients.length === 0) {
            throw new Error('Recipe must have at least one ingredient')
          }

          // Check for duplicate ingredients
          const ingredientIds = ingredients.map((ing: RecipeIngredientInput) => ing.ingredientId)
          const uniqueIngredientIds = [...new Set(ingredientIds)]
          if (ingredientIds.length !== uniqueIngredientIds.length) {
            throw new Error('Recipe cannot contain duplicate ingredients')
          }
        }

        // Update basic recipe info
        await tx.update(recipe).set({
          ...(name !== undefined && { name: name.trim() }),
          ...(description !== undefined && { description: description.trim() }),
          ...(fireEssence !== undefined && { fireEssence: fireEssence?.trim() || null }),
          ...(airEssence !== undefined && { airEssence: airEssence?.trim() || null }),
          ...(waterEssence !== undefined && { waterEssence: waterEssence?.trim() || null }),
          ...(lightningEssence !== undefined && { lightningEssence: lightningEssence?.trim() || null }),
          ...(earthEssence !== undefined && { earthEssence: earthEssence?.trim() || null }),
          ...(lifeEssence !== undefined && { lifeEssence: lifeEssence?.trim() || null }),
          ...(deathEssence !== undefined && { deathEssence: deathEssence?.trim() || null }),
          updatedAt: new Date().toISOString()
        }).where(eq(recipe.id, id))

        // Update ingredients if provided
        if (ingredients !== undefined) {
          // Verify all ingredients exist
          const ingredientIds = ingredients.map((ing: RecipeIngredientInput) => ing.ingredientId)
          const uniqueIngredientIds = [...new Set(ingredientIds)]
          const existingIngredients = await tx.select().from(ingredient).where(inArray(ingredient.id, ingredientIds))

          if (existingIngredients.length !== uniqueIngredientIds.length) {
            throw new Error('One or more ingredients not found')
          }

          // Remove existing recipe-ingredient relationships
          await tx.delete(recipeIngredient).where(eq(recipeIngredient.recipeId, id))

          // Create new recipe-ingredient relationships with quantities
          await Promise.all(
            ingredients.map((ing: RecipeIngredientInput) =>
              tx.insert(recipeIngredient).values({
                recipeId: id,
                ingredientId: ing.ingredientId,
                quantity: ing.quantity || 1
              })
            )
          )
        }
      })
    } catch (transactionError) {
      // Handle validation errors from transaction
      if (transactionError instanceof Error) {
        const errorMessage = transactionError.message
        if (errorMessage.includes('required') || errorMessage.includes('must be') || errorMessage.includes('duplicate') || errorMessage.includes('not found')) {
          setResponseStatus(event, 400)
          return { error: errorMessage }
        }
      }
      throw transactionError
    }

    // Fetch the updated recipe with ingredients
    const recipeWithIngredients = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      with: {
        ingredients: {
          with: { ingredient: true }
        }
      }
    })

    return recipeWithIngredients
  } catch (error) {
    return handleUnknownError(event, 'updating recipe', error)
  }
})
