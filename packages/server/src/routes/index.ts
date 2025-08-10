import { Router } from 'express'
import ingredientRoutes from './ingredients/index.js'
import inventoryRoutes from './inventory/index.js'
import recipeRoutes from './recipes/index.js'

const router: Router = Router()

router.use('/ingredients', ingredientRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/recipes', recipeRoutes)

export default router
