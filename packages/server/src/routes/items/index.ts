import { Router } from 'express'
import createRouter from './create.js'
import getRouter from './get.js'

const router: Router = Router()

router.use('/', createRouter)
router.use('/', getRouter)

export default router
