import 'dotenv/config'
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '../src/generated/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { execSync } from 'child_process'
import pg from 'pg'

const { Pool } = pg

const testConnectionString = 'postgresql://postgres:postgres@localhost:5433/minerva_test'
const testPool = new Pool({ connectionString: testConnectionString })
const testAdapter = new PrismaPg(testPool)

export const testPrisma = new PrismaClient({ adapter: testAdapter })

// Global setup flag to ensure database is initialized only once
let isGlobalSetupDone = false

beforeAll(async () => {
  // Only do global setup once across all test files
  if (!isGlobalSetupDone) {
    // Wait for test database to be ready
    let retries = 30
    while (retries > 0) {
      try {
        await testPrisma.$connect()
        break
      } catch {
        retries--
        if (retries === 0) {
          throw new Error('Could not connect to test database after 30 retries')
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Push the schema to the test database
    try {
      execSync('DATABASE_URL="postgresql://postgres:postgres@localhost:5433/minerva_test" pnpm prisma db push --force-reset', {
        cwd: process.cwd(),
        stdio: 'pipe' // Use pipe instead of inherit to reduce noise
      })
      isGlobalSetupDone = true
    } catch (error) {
      console.error('Failed to push schema to test database:', error)
      throw error
    }
  }
})

beforeEach(async () => {
  // Clean all tables before each test
  await cleanDatabase()
})

afterEach(async () => {
  // Clean all tables after each test
  await cleanDatabase()
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

export async function cleanDatabase() {
  // Delete in correct order to avoid foreign key constraints
  // Use try-catch to handle tables that might not exist

  // First delete all dependent tables that have foreign keys
  try {
    await testPrisma.scheduledTask.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  try {
    await testPrisma.daySchedule.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  try {
    await testPrisma.weekSchedule.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  try {
    await testPrisma.taskDefinition.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  // Delete inventory items before ingredients/items/potions
  try {
    await testPrisma.inventoryItem.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  try {
    await testPrisma.itemInventoryItem.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  try {
    await testPrisma.potionInventoryItem.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  try {
    await testPrisma.currency.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  // Delete potions before recipes (potions depend on recipes)
  try {
    await testPrisma.potion.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  // Delete recipe ingredients before recipes and ingredients
  try {
    await testPrisma.recipeIngredient.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  // Now delete main entities
  try {
    await testPrisma.recipe.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  try {
    await testPrisma.ingredient.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  try {
    await testPrisma.item.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  try {
    await testPrisma.person.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  try {
    await testPrisma.skill.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  try {
    await testPrisma.spell.deleteMany()
  } catch {
    // Table might not exist, ignore
  }

  // Reset auto-increment sequences to ensure consistent IDs
  try {
    await testPrisma.$executeRaw`ALTER SEQUENCE "Ingredient_id_seq" RESTART WITH 1`
  } catch { /* ignore */ }
  try {
    await testPrisma.$executeRaw`ALTER SEQUENCE "Item_id_seq" RESTART WITH 1`
  } catch { /* ignore */ }
  try {
    await testPrisma.$executeRaw`ALTER SEQUENCE "Recipe_id_seq" RESTART WITH 1`
  } catch { /* ignore */ }
  try {
    await testPrisma.$executeRaw`ALTER SEQUENCE "Potion_id_seq" RESTART WITH 1`
  } catch { /* ignore */ }
  try {
    await testPrisma.$executeRaw`ALTER SEQUENCE "InventoryItem_id_seq" RESTART WITH 1`
  } catch { /* ignore */ }
  try {
    await testPrisma.$executeRaw`ALTER SEQUENCE "PotionInventoryItem_id_seq" RESTART WITH 1`
  } catch { /* ignore */ }
  try {
    await testPrisma.$executeRaw`ALTER SEQUENCE "ItemInventoryItem_id_seq" RESTART WITH 1`
  } catch { /* ignore */ }
  try {
    await testPrisma.$executeRaw`ALTER SEQUENCE "Currency_id_seq" RESTART WITH 1`
  } catch { /* ignore */ }
  try {
    await testPrisma.$executeRaw`ALTER SEQUENCE "Person_id_seq" RESTART WITH 1`
  } catch { /* ignore */ }
  try {
    await testPrisma.$executeRaw`ALTER SEQUENCE "Skill_id_seq" RESTART WITH 1`
  } catch { /* ignore */ }
  try {
    await testPrisma.$executeRaw`ALTER SEQUENCE "Spell_id_seq" RESTART WITH 1`
  } catch { /* ignore */ }
}

export async function createTestIngredient(data: {
  name: string
  description?: string
  secured?: boolean
}) {
  return await testPrisma.ingredient.create({
    data: {
      name: data.name,
      description: data.description || 'Test ingredient',
      secured: data.secured || false
    }
  })
}

export async function createTestItem(data: {
  name: string
  description?: string
}) {
  return await testPrisma.item.create({
    data: {
      name: data.name,
      description: data.description || 'Test item'
    }
  })
}

export async function createTestCurrency(data: {
  name: string
  value: number
}) {
  return await testPrisma.currency.create({
    data: {
      name: data.name,
      value: data.value
    }
  })
}

export async function createTestPerson(data: {
  name: string
  description?: string
  relationship?: string
  notableEvents?: string
  url?: string
  isFavorited?: boolean
}) {
  return await testPrisma.person.create({
    data: {
      name: data.name,
      description: data.description,
      relationship: data.relationship,
      notableEvents: data.notableEvents,
      url: data.url,
      isFavorited: data.isFavorited || false
    }
  })
}

export async function createTestSpell(data: {
  name: string
  currentStars?: number
  neededStars?: number
  isLearned?: boolean
}) {
  return await testPrisma.spell.create({
    data: {
      name: data.name,
      currentStars: data.currentStars || 0,
      neededStars: data.neededStars || 1,
      isLearned: data.isLearned || false
    }
  })
}

export async function createTestSkill(data: {
  name: string
}) {
  return await testPrisma.skill.create({
    data: {
      name: data.name
    }
  })
}

export async function createTestRecipe(data: {
  name: string
  description?: string
}) {
  return await testPrisma.recipe.create({
    data: {
      name: data.name,
      description: data.description || 'Test recipe'
    }
  })
}
