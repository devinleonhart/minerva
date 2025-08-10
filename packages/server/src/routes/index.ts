import { Router } from 'express'
import ingredientRoutes from './ingredients/index.js'
import inventoryRoutes from './inventory/index.js'

const router: Router = Router()

router.use('/ingredients', ingredientRoutes)
router.use('/inventory', inventoryRoutes)

export default router
