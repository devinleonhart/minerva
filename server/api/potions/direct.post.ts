import { eventHandler, readBody, setResponseStatus } from 'h3'
import { db } from '../../utils/db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'
import { potion, potionInventoryItem, recipe } from '../../db/index.js'
import { eq } from 'drizzle-orm'

interface DirectPotionRequest {
  recipeId: number
  quality?: string
  cauldronName?: string | null
  cauldronDescription?: string | null
}

export default eventHandler(async (event) => {
  try {
    const { recipeId, quality = 'NORMAL', cauldronName = null, cauldronDescription = null } = (await readBody(event) ?? {}) as DirectPotionRequest

    if (quality !== undefined && (
      quality === null ||
      quality === '' ||
      typeof quality !== 'string' ||
      !['NORMAL', 'HQ', 'LQ'].includes(quality)
    )) {
      setResponseStatus(event, 400)
      return { error: 'Invalid quality. Must be NORMAL, HQ, or LQ' }
    }

    if (!recipeId) {
      setResponseStatus(event, 400)
      return { error: 'recipeId is required' }
    }

    const [recipeRow] = await db.select().from(recipe).where(eq(recipe.id, recipeId))
    if (!recipeRow) {
      setResponseStatus(event, 404)
      return { error: 'Recipe not found' }
    }

    const resultPotion = await db.transaction(async (tx) => {
      const existingPotion = await tx.query.potion.findFirst({
        where: (p, { eq, and, isNull }) => cauldronName
          ? and(eq(p.recipeId, recipeId), eq(p.quality, quality as 'NORMAL' | 'HQ' | 'LQ'), eq(p.cauldronName, cauldronName!))
          : and(eq(p.recipeId, recipeId), eq(p.quality, quality as 'NORMAL' | 'HQ' | 'LQ'), isNull(p.cauldronName)),
        with: { inventoryItems: true }
      })

      type PotionInvItem = { id: number; quantity: number }
      if (existingPotion && (existingPotion.inventoryItems as PotionInvItem[]).length > 0) {
        const invItem = (existingPotion.inventoryItems as PotionInvItem[])[0]!
        await tx.update(potionInventoryItem).set({
          quantity: invItem.quantity + 1,
          updatedAt: new Date().toISOString()
        }).where(eq(potionInventoryItem.id, invItem.id))
        return existingPotion
      } else {
        const [newPotion] = await tx.insert(potion).values({
          quality: quality as 'NORMAL' | 'HQ' | 'LQ',
          recipeId: recipeId,
          cauldronName,
          cauldronDescription,
          updatedAt: new Date().toISOString()
        }).returning()

        await tx.insert(potionInventoryItem).values({
          potionId: newPotion!.id,
          quantity: 1,
          updatedAt: new Date().toISOString()
        })

        return newPotion
      }
    })

    const potionWithInventory = await db.query.potion.findFirst({
      where: (p, { eq }) => eq(p.id, resultPotion!.id),
      with: { inventoryItems: true }
    })

    if (!potionWithInventory) {
      setResponseStatus(event, 500)
      return { error: 'Failed to create potion' }
    }

    setResponseStatus(event, 201)
    return potionWithInventory
  } catch (error) {
    return handleUnknownError(event, 'creating potion directly', error)
  }
})
