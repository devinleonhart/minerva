import { beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient, Prisma } from '../src/generated/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { getTestDatabaseUrl } from '../src/config/databaseUrls.js'

const { Pool } = pg

const testConnectionString = getTestDatabaseUrl()
const testPool = new Pool({ connectionString: testConnectionString })
const testAdapter = new PrismaPg(testPool)

export const testPrisma = new PrismaClient({ adapter: testAdapter })

beforeAll(async () => {
  // Connect to database (schema is already set up by globalSetup)
  try {
    await testPrisma.$connect()
  } catch {
    // If already connected, ignore
  }
  // Clean database before each test file starts
  await cleanDatabase()
})

beforeEach(async () => {
  // Clean all tables before each test
  await cleanDatabase()
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

export async function cleanDatabase() {
  // Delete all data and reset sequences in a single transaction for atomicity
  await testPrisma.$transaction(async (tx) => {
    // Delete in correct order to avoid foreign key constraints
    // First delete all dependent tables that have foreign keys
    await tx.scheduledTask.deleteMany().catch(() => {})
    await tx.daySchedule.deleteMany().catch(() => {})
    await tx.weekSchedule.deleteMany().catch(() => {})
    await tx.taskDefinition.deleteMany().catch(() => {})

    // Delete inventory items before ingredients/items/potions
    await tx.inventoryItem.deleteMany().catch(() => {})
    await tx.itemInventoryItem.deleteMany().catch(() => {})
    await tx.potionInventoryItem.deleteMany().catch(() => {})
    await tx.currency.deleteMany().catch(() => {})

    // Delete potions before recipes (potions depend on recipes)
    await tx.potion.deleteMany().catch(() => {})

    // Delete recipe ingredients before recipes and ingredients
    await tx.recipeIngredient.deleteMany().catch(() => {})

    // Now delete main entities
    await tx.recipe.deleteMany().catch(() => {})
    await tx.ingredient.deleteMany().catch(() => {})
    await tx.item.deleteMany().catch(() => {})
    await tx.person.deleteMany().catch(() => {})
    await tx.skill.deleteMany().catch(() => {})
    await tx.spell.deleteMany().catch(() => {})
  })

  // Reset auto-increment sequences to ensure consistent IDs
  // Do this after the transaction to ensure all deletes are committed
  // Use setval with 1, false to set the last_value to 1, so nextval will return 2
  // Or use RESTART WITH 1 to reset the sequence to start at 1
  try {
    await testPrisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        ALTER SEQUENCE "Ingredient_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "Item_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "Recipe_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "Potion_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "InventoryItem_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "PotionInventoryItem_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "ItemInventoryItem_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "Currency_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "Person_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "Skill_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "Spell_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "WeekSchedule_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "DaySchedule_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "ScheduledTask_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "TaskDefinition_id_seq" RESTART WITH 1;
      END $$;
    `)
  } catch (error) {
    // Log error for debugging but don't fail the test
    console.error('Error resetting sequences:', error)
  }
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
  description?: string | null
  relationship?: string | null
  notableEvents?: string | null
  url?: string | null
  isFavorited?: boolean
}) {
  return await testPrisma.person.create({
    data: {
      name: data.name,
      description: data.description || null,
      relationship: data.relationship || null,
      notableEvents: data.notableEvents || null,
      url: data.url || null,
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
      currentStars: data.currentStars ?? 0,
      neededStars: data.neededStars ?? 1,
      isLearned: data.isLearned ?? (data.currentStars !== undefined && data.neededStars !== undefined ? data.currentStars >= data.neededStars : false)
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

export async function createTestInventoryItem(data: {
  ingredientId: number
  quantity?: number
  quality?: 'NORMAL' | 'HQ' | 'LQ'
}) {
  return await testPrisma.inventoryItem.create({
    data: {
      ingredientId: data.ingredientId,
      quantity: data.quantity || 1,
      quality: data.quality || 'NORMAL'
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

export async function createTestRecipeWithIngredients(data: {
  name: string
  description?: string
  ingredientIds: number[]
  quantities?: number[]
}) {
  const recipe = await testPrisma.recipe.create({
    data: {
      name: data.name,
      description: data.description || 'Test recipe'
    }
  })

  // Add ingredients to recipe
  const quantities = data.quantities || data.ingredientIds.map(() => 1)
  for (let i = 0; i < data.ingredientIds.length; i++) {
    await testPrisma.recipeIngredient.create({
      data: {
        recipeId: recipe.id,
        ingredientId: data.ingredientIds[i],
        quantity: quantities[i]
      }
    })
  }

  return recipe
}

export async function createTestPotion(data: {
  recipeId: number
  quality?: 'NORMAL' | 'HQ' | 'LQ'
}) {
  const potion = await testPrisma.potion.create({
    data: {
      recipeId: data.recipeId,
      quality: data.quality || 'NORMAL'
    }
  })

  // Create inventory item for potion
  await testPrisma.potionInventoryItem.create({
    data: {
      potionId: potion.id,
      quantity: 1
    }
  })

  return potion
}

export async function createTestWeekSchedule(data: {
  weekStartDate: Date
  totalScheduledUnits?: number
  freeTimeUsed?: boolean
}) {
  return await testPrisma.weekSchedule.create({
    data: {
      weekStartDate: data.weekStartDate,
      totalScheduledUnits: data.totalScheduledUnits || 0,
      freeTimeUsed: data.freeTimeUsed || false
    }
  })
}

export async function createTestDaySchedule(data: {
  weekScheduleId: number
  day: number
  dayName: string
  totalUnits?: number
}) {
  return await testPrisma.daySchedule.create({
    data: {
      weekScheduleId: data.weekScheduleId,
      day: data.day,
      dayName: data.dayName,
      totalUnits: data.totalUnits || 0
    }
  })
}

export async function createTestScheduledTask(data: {
  dayScheduleId: number
  type: 'GATHER_INGREDIENT' | 'BREWING' | 'SECURE_INGREDIENTS' | 'RESEARCH_RECIPES' | 'RESEARCH_SPELL'
  timeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING'
  timeUnits: number
  day: number
  notes?: string | null
  details?: unknown
}) {
  return await testPrisma.scheduledTask.create({
    data: {
      dayScheduleId: data.dayScheduleId,
      type: data.type,
      timeSlot: data.timeSlot,
      timeUnits: data.timeUnits,
      day: data.day,
      notes: data.notes || null,
      details: data.details as Prisma.InputJsonValue | undefined
    }
  })
}

export async function createTestTaskDefinition(data: {
  type: 'GATHER_INGREDIENT' | 'BREWING' | 'SECURE_INGREDIENTS' | 'RESEARCH_RECIPES' | 'RESEARCH_SPELL'
  name: string
  timeUnits: number
  color: string
  description: string
  restrictions?: unknown
}) {
  return await testPrisma.taskDefinition.create({
    data: {
      type: data.type,
      name: data.name,
      timeUnits: data.timeUnits,
      color: data.color,
      description: data.description,
      restrictions: data.restrictions as Prisma.InputJsonValue | undefined
    }
  })
}
