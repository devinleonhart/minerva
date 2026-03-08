import { beforeAll, afterAll, beforeEach } from 'vitest'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../db/index.js'
import {
  ingredient, item, currency, person, personNotableEvent, spell, skill,
  inventoryItem, recipe, recipeIngredient, recipeCauldronVariant, potion,
  potionInventoryItem, weekSchedule, daySchedule,
  scheduledTask, taskDefinition, itemInventoryItem
} from '../db/index.js'
import { sql } from 'drizzle-orm'
import { getTestDatabaseUrl } from '../utils/databaseUrls.js'

const { Pool } = pg
const testConnectionString = getTestDatabaseUrl()
const testPool = new Pool({ connectionString: testConnectionString })
export const testDb = drizzle(testPool, { schema })

beforeAll(async () => {
  await cleanDatabase()
})

beforeEach(async () => {
  await cleanDatabase()
})

afterAll(async () => {
  await testPool.end().catch(() => {})
})

export async function cleanDatabase() {
  // Delete in correct dependency order
  await testDb.delete(scheduledTask).catch(() => {})
  await testDb.delete(daySchedule).catch(() => {})
  await testDb.delete(weekSchedule).catch(() => {})
  await testDb.delete(taskDefinition).catch(() => {})
  await testDb.delete(inventoryItem).catch(() => {})
  await testDb.delete(itemInventoryItem).catch(() => {})
  await testDb.delete(potionInventoryItem).catch(() => {})
  await testDb.delete(currency).catch(() => {})
  await testDb.delete(potion).catch(() => {})
  await testDb.delete(recipeCauldronVariant).catch(() => {})
  await testDb.delete(recipeIngredient).catch(() => {})
  await testDb.delete(recipe).catch(() => {})
  await testDb.delete(ingredient).catch(() => {})
  await testDb.delete(item).catch(() => {})
  await testDb.delete(personNotableEvent).catch(() => {})
  await testDb.delete(person).catch(() => {})
  await testDb.delete(skill).catch(() => {})
  await testDb.delete(spell).catch(() => {})

  try {
    await testDb.execute(sql`
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
        ALTER SEQUENCE "PersonNotableEvent_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "Skill_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "Spell_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "WeekSchedule_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "DaySchedule_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "ScheduledTask_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "TaskDefinition_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "RecipeCauldronVariant_id_seq" RESTART WITH 1;
      END $$;
    `)
  } catch (error) {
    console.error('Error resetting sequences:', error)
  }
}

export async function createTestIngredient(data: {
  name: string
  description?: string
  secured?: boolean
}) {
  const [row] = await testDb.insert(ingredient).values({
    name: data.name,
    description: data.description ?? 'Test ingredient',
    secured: data.secured ?? false,
    updatedAt: new Date().toISOString()
  }).returning()
  return row
}

export async function createTestItem(data: {
  name: string
  description?: string
}) {
  const [row] = await testDb.insert(item).values({
    name: data.name,
    description: data.description ?? 'Test item',
    updatedAt: new Date().toISOString()
  }).returning()
  return row
}

export async function createTestCurrency(data: {
  name: string
  value: number
}) {
  const [row] = await testDb.insert(currency).values({
    name: data.name,
    value: data.value,
    updatedAt: new Date().toISOString()
  }).returning()
  return row
}

export async function createTestPerson(data: {
  name: string
  description?: string | null
  relationship?: string | null
  notableEvents?: string[]
  url?: string | null
  isFavorited?: boolean
}) {
  const [row] = await testDb.insert(person).values({
    name: data.name,
    description: data.description ?? null,
    relationship: data.relationship ?? null,
    url: data.url ?? null,
    isFavorited: data.isFavorited ?? false,
    updatedAt: new Date().toISOString()
  }).returning()
  if (data.notableEvents && data.notableEvents.length > 0) {
    await testDb.insert(personNotableEvent).values(
      data.notableEvents.map(description => ({
        personId: row!.id,
        description,
        updatedAt: new Date().toISOString()
      }))
    )
  }
  return row
}

export async function createTestSpell(data: {
  name: string
  currentStars?: number
  neededStars?: number
  isLearned?: boolean
}) {
  const cs = data.currentStars ?? 0
  const ns = data.neededStars ?? 1
  const [row] = await testDb.insert(spell).values({
    name: data.name,
    currentStars: cs,
    neededStars: ns,
    isLearned: data.isLearned ?? cs >= ns,
    updatedAt: new Date().toISOString()
  }).returning()
  return row
}

export async function createTestSkill(data: {
  name: string
}) {
  const [row] = await testDb.insert(skill).values({
    name: data.name,
    updatedAt: new Date().toISOString()
  }).returning()
  return row
}

export async function createTestInventoryItem(data: {
  ingredientId: number
  quantity?: number
  quality?: 'NORMAL' | 'HQ' | 'LQ'
}) {
  const [row] = await testDb.insert(inventoryItem).values({
    ingredientId: data.ingredientId,
    quantity: data.quantity ?? 1,
    quality: data.quality ?? 'NORMAL',
    updatedAt: new Date().toISOString()
  }).returning()
  return row
}

export async function createTestRecipe(data: {
  name: string
  description?: string
}) {
  const [row] = await testDb.insert(recipe).values({
    name: data.name,
    description: data.description ?? 'Test recipe',
    updatedAt: new Date().toISOString()
  }).returning()
  return row
}

export async function createTestRecipeWithIngredients(data: {
  name: string
  description?: string
  ingredientIds: number[]
  quantities?: number[]
}) {
  const [recipeRow] = await testDb.insert(recipe).values({
    name: data.name,
    description: data.description ?? 'Test recipe',
    updatedAt: new Date().toISOString()
  }).returning()

  const quantities = data.quantities ?? data.ingredientIds.map(() => 1)
  for (let i = 0; i < data.ingredientIds.length; i++) {
    await testDb.insert(recipeIngredient).values({
      recipeId: recipeRow.id,
      ingredientId: data.ingredientIds[i],
      quantity: quantities[i]
    })
  }

  return recipeRow
}

export async function createTestPotion(data: {
  recipeId: number
  quality?: 'NORMAL' | 'HQ' | 'LQ'
}) {
  const [potionRow] = await testDb.insert(potion).values({
    recipeId: data.recipeId,
    quality: data.quality ?? 'NORMAL',
    updatedAt: new Date().toISOString()
  }).returning()

  await testDb.insert(potionInventoryItem).values({
    potionId: potionRow.id,
    quantity: 1,
    updatedAt: new Date().toISOString()
  })

  return potionRow
}

export async function createTestWeekSchedule(data: {
  weekStartDate: Date
  totalScheduledUnits?: number
  freeTimeUsed?: boolean
}) {
  const [row] = await testDb.insert(weekSchedule).values({
    weekStartDate: data.weekStartDate.toISOString(),
    totalScheduledUnits: data.totalScheduledUnits ?? 0,
    freeTimeUsed: data.freeTimeUsed ?? false,
    updatedAt: new Date().toISOString()
  }).returning()
  return row
}

export async function createTestDaySchedule(data: {
  weekScheduleId: number
  day: number
  dayName: string
  totalUnits?: number
}) {
  const [row] = await testDb.insert(daySchedule).values({
    weekScheduleId: data.weekScheduleId,
    day: data.day,
    dayName: data.dayName,
    totalUnits: data.totalUnits ?? 0,
    updatedAt: new Date().toISOString()
  }).returning()
  return row
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
  const [row] = await testDb.insert(scheduledTask).values({
    dayScheduleId: data.dayScheduleId,
    type: data.type,
    timeSlot: data.timeSlot,
    timeUnits: data.timeUnits,
    day: data.day,
    notes: data.notes ?? null,
    details: data.details as never ?? null,
    updatedAt: new Date().toISOString()
  }).returning()
  return row
}

export async function createTestTaskDefinition(data: {
  type: 'GATHER_INGREDIENT' | 'BREWING' | 'SECURE_INGREDIENTS' | 'RESEARCH_RECIPES' | 'RESEARCH_SPELL'
  name: string
  timeUnits: number
  color: string
  description: string
  restrictions?: unknown
}) {
  const [row] = await testDb.insert(taskDefinition).values({
    type: data.type,
    name: data.name,
    timeUnits: data.timeUnits,
    color: data.color,
    description: data.description,
    restrictions: data.restrictions as never ?? null,
    updatedAt: new Date().toISOString()
  }).returning()
  return row
}
