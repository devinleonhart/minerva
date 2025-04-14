import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { parseId } from '../../utils/parseId.js'
import { handleUnknownError } from '../../utils/handleUnknownError.js'

const prisma = new PrismaClient()
const router: Router = Router()

router.delete('/:id', async (req, res) => {
  try {
    const id = parseId(req)
    if (id === null) {
      res.status(400).json({ error: 'Invalid ingredient ID' })
      return
    }
    else {
      console.log('Deleting ingredient with ID:', id)
      const ingredient = await prisma.ingredient.delete({ where: { id } })
      if (!ingredient) {
        res.status(404).json({ error: 'Ingredient not found' })
        return
      }
      else {
        res.status(204).send()
      }
    }
  } catch (error) {
    handleUnknownError(res, 'deleting ingredient', error)
  }
})

export default router
