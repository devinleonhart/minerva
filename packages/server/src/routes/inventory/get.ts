import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.get('/', async (req, res) => {
  try {
    const [ingredientItems, potionItems, itemItems] = await Promise.all([
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
          potion: {
            include: {
              recipe: true
            }
          }
        },
        orderBy: {
          potion: {
            recipe: {
              name: 'asc'
            }
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
      })
    ])

    res.json({
      ingredients: ingredientItems,
      potions: potionItems,
      items: itemItems
    })
  } catch (error) {
    handleUnknownError(res, 'fetching inventory', error)
  }
})

export default router
