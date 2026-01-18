import { Router } from 'express'
import getScheduler from './get.js'
import saveScheduler from './save.js'
import loadScheduler from './load.js'
import deleteScheduler from './delete.js'
import cleanupScheduler from './cleanup.js'

const router: Router = Router()

router.use('/save', saveScheduler)
router.use('/load', loadScheduler)
router.use('/cleanup', cleanupScheduler)
router.use('/', deleteScheduler)  // Delete router handles both / and /:id
router.use('/', getScheduler)

export default router
