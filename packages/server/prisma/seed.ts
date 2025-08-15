import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existingCurrencies = await prisma.currency.findMany()

  if (existingCurrencies.length === 0) {
    await prisma.currency.create({
      data: {
        name: 'Gold',
        value: 0
      }
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
