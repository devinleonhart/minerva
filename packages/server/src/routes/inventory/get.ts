import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.get('/', async (req, res) => {
  try {
    const [ingredientItems, potionItems] = await Promise.all([
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
      })
    ])

    res.json({
      ingredients: ingredientItems,
      potions: potionItems
    })
  } catch (error) {
    handleUnknownError(res, 'fetching inventory', error)
  }
})

export default router
