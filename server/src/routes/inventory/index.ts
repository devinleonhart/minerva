import { Router } from 'express'
import getRoutes from './get.js'
import createRoutes from './create.js'
import updateRoutes from './update.js'
import deleteRoutes from './delete.js'
import updatePotionRoutes from './update-potion.js'
import deletePotionRoutes from './delete-potion.js'
import deleteItemRoutes from './delete-item.js'
import createItemRoutes from './create-item.js'
import updateItemRoutes from './update-item.js'
import addCurrencyRoutes from './add-currency.js'
import updateCurrencyRoutes from './update-currency.js'
import deleteCurrencyRoutes from './delete-currency.js'

const router: Router = Router()

router.use('/', getRoutes)
router.use('/', createRoutes)
router.use('/currency', addCurrencyRoutes)
router.use('/currency', updateCurrencyRoutes)
router.use('/currency', deleteCurrencyRoutes)
router.use('/potion', updatePotionRoutes)
router.use('/potion', deletePotionRoutes)
router.use('/item', deleteItemRoutes)
router.use('/item', createItemRoutes)
router.use('/item', updateItemRoutes)
router.use('/', updateRoutes)
// Mount general delete routes last to avoid catching specific route requests
router.use('/', deleteRoutes)

export default router
