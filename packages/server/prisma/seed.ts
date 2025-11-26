import client from '@prisma/client'

const { PrismaClient } = client

const prisma = new PrismaClient()

async function seedIngredients() {
  const count = await prisma.ingredient.count()
  if (count > 0) {
    return
  }

  const ingredientData = [
    {
      name: 'Sunset Lotus',
      description: 'A radiant blossom that absorbs evening sunlight, amplifying restorative potions.'
    },
    {
      name: 'Frostvine Sap',
      description: 'Thick, chilled sap that adds calming properties and frost resistance.'
    },
    {
      name: 'Dragon Pepper',
      description: 'Scalding peppercorn that ignites aggressive effects and battle focus.'
    },
    {
      name: 'Moonstone Dust',
      description: 'Powdered crystal that heightens clarity and magical attunement.'
    },
    {
      name: 'Whisper Reed',
      description: 'Delicate reed that carries lingering scents for invisibility brews.'
    }
  ]

  await prisma.ingredient.createMany({
    data: ingredientData
  })
}

async function seedRecipes() {
  const count = await prisma.recipe.count()
  if (count > 0) {
    return
  }

  const ingredients = await prisma.ingredient.findMany()
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.name, ingredient.id]))

  const recipeSeeds = [
    {
      name: 'Radiant Renewal',
      description: 'Restorative draught that rapidly knits wounds while boosting morale.',
      ingredients: [
        { name: 'Sunset Lotus', quantity: 2 },
        { name: 'Moonstone Dust', quantity: 1 }
      ]
    },
    {
      name: 'Chilling Clarity',
      description: 'Frosty tonic that clears the mind and dampens emotional surges.',
      ingredients: [
        { name: 'Frostvine Sap', quantity: 2 },
        { name: 'Whisper Reed', quantity: 1 }
      ]
    },
    {
      name: 'Inferno Tonic',
      description: 'Aggressive brew that enhances physical prowess at the cost of calm.',
      ingredients: [
        { name: 'Dragon Pepper', quantity: 3 },
        { name: 'Moonstone Dust', quantity: 1 }
      ]
    }
  ]

  for (const recipe of recipeSeeds) {
    await prisma.recipe.create({
      data: {
        name: recipe.name,
        description: recipe.description,
        ingredients: {
          create: recipe.ingredients.map((ingredient) => ({
            quantity: ingredient.quantity,
            ingredient: {
              connect: { id: ingredientMap.get(ingredient.name) }
            }
          }))
        }
      }
    })
  }
}

async function seedInventory() {
  const count = await prisma.inventoryItem.count()
  if (count > 0) {
    return
  }

  const ingredients = await prisma.ingredient.findMany()
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.name, ingredient.id]))

  const inventorySeeds = [
    { name: 'Sunset Lotus', quality: 'NORMAL' as const, quantity: 5 },
    { name: 'Sunset Lotus', quality: 'HQ' as const, quantity: 2 },
    { name: 'Frostvine Sap', quality: 'NORMAL' as const, quantity: 6 },
    { name: 'Dragon Pepper', quality: 'NORMAL' as const, quantity: 4 },
    { name: 'Moonstone Dust', quality: 'LQ' as const, quantity: 3 }
  ]

  const inventoryData = inventorySeeds.map((item) => {
    const ingredientId = ingredientMap.get(item.name)
    if (!ingredientId) {
      throw new Error(`Missing ingredient for inventory seed: ${item.name}`)
    }

    return {
      ingredientId,
      quality: item.quality,
      quantity: item.quantity
    }
  })

  await prisma.inventoryItem.createMany({
    data: inventoryData
  })
}

async function seedPeople() {
  const count = await prisma.person.count()
  if (count > 0) {
    return
  }

  const peopleSeeds = [
    {
      name: 'Alira Voss',
      description: 'Guild master of Minerva, famed for her encyclopedic potion knowledge.',
      relationship: 'Mentor',
      notableEvents: 'Guided the player through their first cauldron mishap.',
      url: 'https://example.com/people/alira'
    },
    {
      name: 'Tarin Calder',
      description: 'Reclusive herbalist who trades rare swamp flora.',
      relationship: 'Trader',
      notableEvents: 'Brokered Frostvine Sap after a midnight rescue.',
      url: null
    },
    {
      name: 'Nyra Vale',
      description: 'Arcane courier who smuggles spell scrolls between city-states.',
      relationship: 'Friend',
      notableEvents: 'Delivered Moonstone Dust just before the eclipse.',
      url: null
    }
  ]

  await prisma.person.createMany({
    data: peopleSeeds
  })
}

async function seedSpells() {
  const count = await prisma.spell.count()
  if (count > 0) {
    return
  }

  const spells = [
    { name: 'Aegis Bloom', currentStars: 1, neededStars: 3, isLearned: false },
    { name: 'Spectral Anchor', currentStars: 2, neededStars: 2, isLearned: true },
    { name: 'Solar Lance', currentStars: 0, neededStars: 4, isLearned: false }
  ]

  await prisma.spell.createMany({
    data: spells
  })
}

async function seedSkills() {
  const count = await prisma.skill.count()
  if (count > 0) {
    return
  }

  const skills = [
    { name: 'Crystal Infusion' },
    { name: 'Rapid Decanting' },
    { name: 'Aromatic Binding' }
  ]

  await prisma.skill.createMany({
    data: skills
  })
}

async function seedCurrencies() {
  const count = await prisma.currency.count()
  if (count > 0) {
    return
  }

  const currencies = [
    { name: 'Gold', value: 150 },
    { name: 'Guild Scrip', value: 45 },
    { name: 'Sun Shards', value: 12 }
  ]

  await prisma.currency.createMany({
    data: currencies
  })
}

async function main() {
  await seedIngredients()
  await seedRecipes()
  await seedInventory()
  await seedPeople()
  await seedSpells()
  await seedSkills()
  await seedCurrencies()

  console.log('Database seeded with default data.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
