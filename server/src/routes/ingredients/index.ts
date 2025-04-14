import { Router } from 'express'
import getRoutes from './get.js'
import createRoutes from './create.js'
import deleteRoutes from './delete.js'

const router: Router = Router()
router.use('/', getRoutes)
router.use('/', createRoutes)
router.use('/', deleteRoutes)

export default router
