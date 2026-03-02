import { Router } from 'express'
import { db } from '../../db.js'
import { inventoryItem, ingredient, itemInventoryItem, item, currency } from '../../../db/index.js'
import { eq, asc } from 'drizzle-orm'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/', async (req, res) => {
  try {
    const [ingredientItems, potionItems, itemItems, currencies] = await Promise.all([
      db
        .select({
          id: inventoryItem.id,
          createdAt: inventoryItem.createdAt,
          updatedAt: inventoryItem.updatedAt,
          ingredientId: inventoryItem.ingredientId,
          quality: inventoryItem.quality,
          quantity: inventoryItem.quantity,
          ingredient: {
            id: ingredient.id,
            name: ingredient.name,
            description: ingredient.description,
            secured: ingredient.secured,
            createdAt: ingredient.createdAt,
            updatedAt: ingredient.updatedAt,
          }
        })
        .from(inventoryItem)
        .innerJoin(ingredient, eq(inventoryItem.ingredientId, ingredient.id))
        .orderBy(asc(ingredient.name)),
      db.query.potionInventoryItem.findMany({
        with: { potion: { with: { recipe: true } } }
      }),
      db
        .select({
          id: itemInventoryItem.id,
          createdAt: itemInventoryItem.createdAt,
          updatedAt: itemInventoryItem.updatedAt,
          itemId: itemInventoryItem.itemId,
          quantity: itemInventoryItem.quantity,
          item: {
            id: item.id,
            name: item.name,
            description: item.description,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }
        })
        .from(itemInventoryItem)
        .innerJoin(item, eq(itemInventoryItem.itemId, item.id))
        .orderBy(asc(item.name)),
      db.select().from(currency).orderBy(asc(currency.name))
    ])

    return res.json({
      ingredients: ingredientItems,
      potions: potionItems,
      items: itemItems,
      currencies
    })
  } catch (error) {
    handleUnknownError(res, 'fetching inventory', error)
  }
})

export default router
