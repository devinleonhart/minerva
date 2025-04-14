import { Router } from 'express'
import getRoutes from './get.js'
import createRoutes from './create.js'

const router = Router()
router.use('/', getRoutes)
router.use('/', createRoutes)

export default router
