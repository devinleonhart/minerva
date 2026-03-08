import { eventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { parseId } from '../../utils/parseId.js'
import { recipe, recipeIngredient, recipeCauldronVariant, ingredient } from '../../db/index.js'
import { eq, inArray } from 'drizzle-orm'

const VALID_ESSENCE_TYPES = ['FIRE', 'AIR', 'WATER', 'LIGHTNING', 'EARTH', 'LIFE', 'DEATH'] as const

interface RecipeIngredientInput {
  ingredientId: number
  quantity: number
}

interface CauldronVariantInput {
  essenceType: string
  variantName: string
  description: string
  essenceIngredientId: number
}

export default eventHandler(async (event) => {
  try {
    const id = parseId(getRouterParam(event, 'id'))
    if (id === null) {
      setResponseStatus(event, 400)
      return { error: 'Invalid recipe ID' }
    }

    const { name, description, ingredients, cauldronVariants } = (await readBody(event) ?? {}) as {
      name?: string
      description?: string
      ingredients?: RecipeIngredientInput[]
      cauldronVariants?: CauldronVariantInput[]
    }

    const existingRecipe = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, id)
    })

    if (!existingRecipe) {
      setResponseStatus(event, 404)
      return { error: 'Recipe not found' }
    }

    // Pre-transaction validation
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      setResponseStatus(event, 400)
      return { error: 'Recipe name is required' }
    }

    if (description !== undefined && (typeof description !== 'string' || description.trim() === '')) {
      setResponseStatus(event, 400)
      return { error: 'Recipe description is required' }
    }

    if (ingredients !== undefined) {
      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        setResponseStatus(event, 400)
        return { error: 'Ingredients must be a non-empty array' }
      }
      const ingredientIds = ingredients.map((ing: RecipeIngredientInput) => ing.ingredientId)
      const uniqueIngredientIds = [...new Set(ingredientIds)]
      if (ingredientIds.length !== uniqueIngredientIds.length) {
        setResponseStatus(event, 400)
        return { error: 'Recipe cannot contain duplicate ingredients' }
      }
      const existingIngredients = await db.select().from(ingredient).where(inArray(ingredient.id, uniqueIngredientIds))
      if (existingIngredients.length !== uniqueIngredientIds.length) {
        setResponseStatus(event, 400)
        return { error: 'One or more ingredients not found' }
      }
    }

    if (cauldronVariants !== undefined) {
      if (!Array.isArray(cauldronVariants)) {
        setResponseStatus(event, 400)
        return { error: 'cauldronVariants must be an array' }
      }
      const essenceTypesSeen = new Set<string>()
      for (const v of cauldronVariants) {
        if (!VALID_ESSENCE_TYPES.includes(v.essenceType as typeof VALID_ESSENCE_TYPES[number])) {
          setResponseStatus(event, 400)
          return { error: `Invalid essence type: ${v.essenceType}` }
        }
        if (!v.variantName || typeof v.variantName !== 'string' || v.variantName.trim().length === 0) {
          setResponseStatus(event, 400)
          return { error: 'Each cauldron variant must have a variantName' }
        }
        if (!v.description || typeof v.description !== 'string' || v.description.trim().length === 0) {
          setResponseStatus(event, 400)
          return { error: 'Each cauldron variant must have a description' }
        }
        if (!v.essenceIngredientId || typeof v.essenceIngredientId !== 'number') {
          setResponseStatus(event, 400)
          return { error: 'Each cauldron variant must have an essenceIngredientId' }
        }
        if (essenceTypesSeen.has(v.essenceType)) {
          setResponseStatus(event, 400)
          return { error: `Duplicate essence type: ${v.essenceType}` }
        }
        essenceTypesSeen.add(v.essenceType)
      }
      if (cauldronVariants.length > 0) {
        const variantIngredientIds = cauldronVariants.map(v => v.essenceIngredientId)
        const foundIngredients = await db.select().from(ingredient).where(inArray(ingredient.id, variantIngredientIds))
        if (foundIngredients.length !== new Set(variantIngredientIds).size) {
          setResponseStatus(event, 400)
          return { error: 'One or more essence ingredients not found' }
        }
      }
    }

    await db.transaction(async (tx) => {
      await tx.update(recipe).set({
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        updatedAt: new Date().toISOString()
      }).where(eq(recipe.id, id))

      if (ingredients !== undefined) {
        await tx.delete(recipeIngredient).where(eq(recipeIngredient.recipeId, id))
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

      if (cauldronVariants !== undefined) {
        await tx.delete(recipeCauldronVariant).where(eq(recipeCauldronVariant.recipeId, id))
        if (cauldronVariants.length > 0) {
          await Promise.all(
            cauldronVariants.map(v =>
              tx.insert(recipeCauldronVariant).values({
                recipeId: id,
                essenceType: v.essenceType,
                variantName: v.variantName.trim(),
                description: v.description.trim(),
                essenceIngredientId: v.essenceIngredientId,
                updatedAt: new Date().toISOString()
              })
            )
          )
        }
      }
    })

    const updated = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      with: {
        ingredients: { with: { ingredient: true } },
        cauldronVariants: { with: { essenceIngredient: true } }
      }
    })

    return updated
  } catch (error) {
    return handleUnknownError(event, 'updating recipe', error)
  }
})
