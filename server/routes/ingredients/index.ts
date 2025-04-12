import { Router } from 'express'
import getRoutes from './get'
import createRoutes from './create'

const router = Router()
router.use('/', getRoutes)
router.use('/', createRoutes)

export default router
