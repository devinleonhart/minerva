import { Router } from 'express'
import getRoutes from './get.js'
import createRoutes from './create.js'
import updateRoutes from './update.js'
import deleteRoutes from './delete.js'
import craftableRoutes from './craftable.js'

const router: Router = Router()
router.use('/', getRoutes)
router.use('/', createRoutes)
router.use('/', updateRoutes)
router.use('/', deleteRoutes)
router.use('/', craftableRoutes)

export default router
