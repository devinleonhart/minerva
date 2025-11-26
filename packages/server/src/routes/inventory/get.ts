import { Router } from 'express'
import { prisma } from '../../db.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const router: Router = Router()

router.get('/', async (req, res) => {
  try {
    const [ingredientItems, potionItems, itemItems, currencies] = await Promise.all([
      prisma.inventoryItem.findMany({
        include: {
          ingredient: true
        },
        orderBy: {
          ingredient: {
            name: 'asc'
          }
        }
      }),
      prisma.potionInventoryItem.findMany({
        include: {
          potion: true
        },
        orderBy: {
          potion: {
            recipeId: 'asc'
          }
        }
      }),
      prisma.itemInventoryItem.findMany({
        include: {
          item: true
        },
        orderBy: {
          item: {
            name: 'asc'
          }
        }
      }),
      prisma.currency.findMany({
        orderBy: {
          name: 'asc'
        }
      })
    ])

    // Fetch recipe information for potions separately
    const potionItemsWithRecipes = await Promise.all(
      potionItems.map(async (potionItem) => {
        const recipe = await prisma.recipe.findUnique({
          where: { id: potionItem.potion.recipeId }
        })
        return {
          ...potionItem,
          potion: {
            ...potionItem.potion,
            recipe: recipe
          }
        }
      })
    )

    res.json({
      ingredients: ingredientItems,
      potions: potionItemsWithRecipes,
      items: itemItems,
      currencies: currencies
    })
  } catch (error) {
    handleUnknownError(res, 'fetching inventory', error)
  }
})

export default router
