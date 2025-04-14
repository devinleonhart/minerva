import { Router } from 'express'
import ingredientRoutes from './ingredients/index.js'

const router = Router()

router.use('/ingredients', ingredientRoutes)

export default router
