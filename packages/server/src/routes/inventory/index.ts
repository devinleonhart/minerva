import { Router } from 'express'
import getRoutes from './get.js'
import createRoutes from './create.js'
import updateRoutes from './update.js'
import deleteRoutes from './delete.js'
import updatePotionRoutes from './update-potion.js'
import deletePotionRoutes from './delete-potion.js'

const router: Router = Router()
router.use('/', getRoutes)
router.use('/', createRoutes)
router.use('/', updateRoutes)
router.use('/', deleteRoutes)
router.use('/', updatePotionRoutes)
router.use('/', deletePotionRoutes)

export default router
