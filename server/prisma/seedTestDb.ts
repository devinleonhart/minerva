import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedTestDb() {
  await prisma.ingredient.createMany({
    data: [
      { name: 'Dragon Scale', description: 'Rare and magical scale.', secured: false },
      { name: 'Phoenix Feather', description: 'Fiery feather of rebirth.', secured: false },
      { name: 'Unicorn Fur', description: 'Purity crystallized.', secured: false },
    ],
  })
}
