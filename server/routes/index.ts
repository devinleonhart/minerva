import { Router } from 'express'
import ingredientRoutes from './ingredients'

const router = Router()

router.use('/ingredients', ingredientRoutes)

export default router
