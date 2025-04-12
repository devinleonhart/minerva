import { PrismaClient } from '../../generated/prisma'

const prisma = new PrismaClient()

export async function resetDb() {
  await prisma.recipeIngredient.deleteMany()
  await prisma.recipe.deleteMany()
  await prisma.ingredient.deleteMany()
}
