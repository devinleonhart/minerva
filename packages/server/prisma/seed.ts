import 'dotenv/config'
import { PrismaClient } from '../src/generated/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

const connectionString = process.env.MINERVA_DATABASE_URL
if (!connectionString) {
  throw new Error('MINERVA_DATABASE_URL environment variable is required')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function resetDatabase() {
  console.log('Resetting database...')

  // Scheduler tables
  await prisma.scheduledTask.deleteMany()
  await prisma.daySchedule.deleteMany()
  await prisma.weekSchedule.deleteMany()
  await prisma.taskDefinition.deleteMany()

  // Inventory + crafting tables
  await prisma.potionInventoryItem.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.itemInventoryItem.deleteMany()
  await prisma.item.deleteMany()
  await prisma.potion.deleteMany()
  await prisma.recipeIngredient.deleteMany()

  // Core domain tables
  await prisma.recipe.deleteMany()
  await prisma.ingredient.deleteMany()

  // Reference / misc tables
  await prisma.currency.deleteMany()
  await prisma.person.deleteMany()
  await prisma.spell.deleteMany()
  await prisma.skill.deleteMany()

  console.log('All tables cleared.')
}

async function seedIngredients() {
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

  await prisma.ingredient.createMany({ data: ingredientData })
}

async function seedRecipes() {
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
          create: recipe.ingredients.map((ingredient) => {
            const ingredientId = ingredientMap.get(ingredient.name)
            if (!ingredientId) {
              throw new Error(`Missing ingredient for recipe seed: ${ingredient.name}`)
            }
            return {
              quantity: ingredient.quantity,
              ingredient: {
                connect: { id: ingredientId }
              }
            }
          })
        }
      }
    })
  }
}

async function seedIngredientInventory() {
  const ingredients = await prisma.ingredient.findMany()
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.name, ingredient.id]))

  const inventorySeeds = [
    { name: 'Sunset Lotus', quality: 'NORMAL' as const, quantity: 5 },
    { name: 'Sunset Lotus', quality: 'HQ' as const, quantity: 2 },
    { name: 'Frostvine Sap', quality: 'NORMAL' as const, quantity: 6 },
    { name: 'Dragon Pepper', quality: 'NORMAL' as const, quantity: 4 },
    { name: 'Moonstone Dust', quality: 'LQ' as const, quantity: 3 }
  ]

  await prisma.inventoryItem.createMany({
    data: inventorySeeds.map((item) => {
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
  })
}

async function seedItems() {
  const items = [
    {
      name: 'Crystal Stirring Rod',
      description: 'Channel steady mana while stirring volatile mixtures.'
    },
    {
      name: 'Moonlit Vial',
      description: 'A vial etched with lunar runes that preserves potion potency.'
    },
    {
      name: 'Runed Satchel',
      description: 'Bag infused with dimensional magic for ingredient storage.'
    }
  ]

  await prisma.item.createMany({ data: items })
}

async function seedItemInventory() {
  const items = await prisma.item.findMany()
  const itemMap = new Map(items.map((item) => [item.name, item.id]))

  const inventorySeeds = [
    { name: 'Crystal Stirring Rod', quantity: 2 },
    { name: 'Moonlit Vial', quantity: 4 },
    { name: 'Runed Satchel', quantity: 1 }
  ]

  await prisma.itemInventoryItem.createMany({
    data: inventorySeeds.map((entry) => {
      const itemId = itemMap.get(entry.name)
      if (!itemId) {
        throw new Error(`Missing item for item inventory seed: ${entry.name}`)
      }

      return {
        itemId,
        quantity: entry.quantity
      }
    })
  })
}

async function seedPotionsAndInventory() {
  const recipes = await prisma.recipe.findMany()
  const recipeMap = new Map(recipes.map((recipe) => [recipe.name, recipe.id]))

  const potionSeeds = [
    { recipe: 'Radiant Renewal', quality: 'HQ' as const, quantity: 2 },
    { recipe: 'Radiant Renewal', quality: 'NORMAL' as const, quantity: 1 },
    { recipe: 'Chilling Clarity', quality: 'NORMAL' as const, quantity: 3 },
    { recipe: 'Inferno Tonic', quality: 'NORMAL' as const, quantity: 1 }
  ]

  for (const seed of potionSeeds) {
    const recipeId = recipeMap.get(seed.recipe)
    if (!recipeId) {
      throw new Error(`Missing recipe for potion seed: ${seed.recipe}`)
    }

    const potion = await prisma.potion.create({
      data: {
        recipeId,
        quality: seed.quality
      }
    })

    await prisma.potionInventoryItem.create({
      data: {
        potionId: potion.id,
        quantity: seed.quantity
      }
    })
  }
}

async function seedPeople() {
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

  await prisma.person.createMany({ data: peopleSeeds })
}

async function seedSpells() {
  const spells = [
    { name: 'Aegis Bloom', currentStars: 1, neededStars: 3, isLearned: false },
    { name: 'Spectral Anchor', currentStars: 2, neededStars: 2, isLearned: true },
    { name: 'Solar Lance', currentStars: 0, neededStars: 4, isLearned: false }
  ]

  await prisma.spell.createMany({ data: spells })
}

async function seedSkills() {
  const skills = [
    { name: 'Crystal Infusion' },
    { name: 'Rapid Decanting' },
    { name: 'Aromatic Binding' }
  ]

  await prisma.skill.createMany({ data: skills })
}

async function seedCurrencies() {
  const currencies = [
    { name: 'Gold', value: 150 },
    { name: 'Guild Scrip', value: 45 },
    { name: 'Sun Shards', value: 12 }
  ]

  await prisma.currency.createMany({ data: currencies })
}

async function main() {
  await resetDatabase()
  await seedIngredients()
  await seedRecipes()
  await seedIngredientInventory()
  await seedItems()
  await seedItemInventory()
  await seedPotionsAndInventory()
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
