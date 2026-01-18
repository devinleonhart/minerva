import { Router } from 'express'
import ingredientRoutes from './ingredients/index.js'
import inventoryRoutes from './inventory/index.js'
import recipeRoutes from './recipes/index.js'
import potionRoutes from './potions/index.js'
import itemRoutes from './items/index.js'
import schedulerRoutes from './scheduler/index.js'
import peopleRoutes from './people/index.js'
import skillsRoutes from './skills/index.js'
import spellsRoutes from './spells/index.js'

const router: Router = Router()

router.use('/ingredients', ingredientRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/recipes', recipeRoutes)
router.use('/potions', potionRoutes)
router.use('/items', itemRoutes)
router.use('/scheduler', schedulerRoutes)
router.use('/people', peopleRoutes)
router.use('/skills', skillsRoutes)
router.use('/spells', spellsRoutes)

export default router
