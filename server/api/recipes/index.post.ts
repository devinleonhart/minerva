import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { recipe, recipeIngredient, ingredient, recipeCauldronVariant } from '../../db/index.js'
import { inArray } from 'drizzle-orm'

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
    const { name, description, ingredients, cauldronVariants } = (await readBody(event) ?? {}) as {
      name: string
      description: string
      ingredients: RecipeIngredientInput[]
      cauldronVariants?: CauldronVariantInput[]
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      setResponseStatus(event, 400)
      return { error: 'Recipe name is required' }
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
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

    // Validate cauldron variants if provided
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

    const newRecipe = await db.transaction(async (tx) => {
      const [createdRecipe] = await tx.insert(recipe).values({
        name: name.trim(),
        description: description.trim(),
        updatedAt: new Date().toISOString()
      }).returning()

      await Promise.all(
        ingredients.map((ing: RecipeIngredientInput) =>
          tx.insert(recipeIngredient).values({
            recipeId: createdRecipe!.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity || 1
          })
        )
      )

      if (cauldronVariants && cauldronVariants.length > 0) {
        await Promise.all(
          cauldronVariants.map(v =>
            tx.insert(recipeCauldronVariant).values({
              recipeId: createdRecipe!.id,
              essenceType: v.essenceType,
              variantName: v.variantName.trim(),
              description: v.description.trim(),
              essenceIngredientId: v.essenceIngredientId,
              updatedAt: new Date().toISOString()
            })
          )
        )
      }

      return createdRecipe
    })

    const recipeWithData = await db.query.recipe.findFirst({
      where: (r, { eq }) => eq(r.id, newRecipe!.id),
      with: {
        ingredients: { with: { ingredient: true } },
        cauldronVariants: { with: { essenceIngredient: true } }
      }
    })

    setResponseStatus(event, 201)
    return recipeWithData
  } catch (error) {
    return handleUnknownError(event, 'creating recipe', error)
  }
})
