import { PrismaClient } from '../../generated/prisma'

const prisma = new PrismaClient()

export async function seed() {
  await prisma.recipeIngredient.deleteMany()
  await prisma.recipe.deleteMany()
  await prisma.ingredient.deleteMany()

  await prisma.ingredient.createMany({
    data: [
      { id: 1, name: 'Dragon Scale', description: 'Rare and magical scale.', secured: false },
      { id: 2, name: 'Phoenix Feather', description: 'Fiery feather of rebirth.', secured: false },
      { id: 3, name: 'Unicorn Fur', description: 'Purity crystallized.', secured: false }
    ],
    skipDuplicates: true
  })
}
