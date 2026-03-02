import { beforeAll, afterAll, beforeEach } from 'vitest'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../db/index.js'
import {
  ingredient, item, currency, person, spell, skill,
  inventoryItem, recipe, recipeIngredient, potion,
  potionInventoryItem, weekSchedule, daySchedule,
  scheduledTask, taskDefinition, itemInventoryItem
} from '../db/index.js'
import { eq, and, sql } from 'drizzle-orm'
import { getTestDatabaseUrl } from '../src/config/databaseUrls.js'

const { Pool } = pg
const testConnectionString = getTestDatabaseUrl()
const testPool = new Pool({ connectionString: testConnectionString })
export const testDb = drizzle(testPool, { schema })

// Helper to build a where clause from a plain object
function buildWhere(tableObj: Record<string, unknown>, where: Record<string, unknown>) {
  const conditions = Object.entries(where)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => {
      if (v instanceof Date) {
        // Compare as date string
        return eq((tableObj as Record<string, unknown>)[k] as never, v.toISOString() as never)
      }
      return eq((tableObj as Record<string, unknown>)[k] as never, v as never)
    })
  if (conditions.length === 0) return undefined
  if (conditions.length === 1) return conditions[0]
  return and(...conditions)
}

// Generic table API builder
function makeApi<T extends object>(tableObj: T) {
  return {
    async findUnique({ where }: { where: Record<string, unknown>, include?: unknown }) {
      const clause = buildWhere(tableObj as Record<string, unknown>, where)
      const [row] = clause
        ? await testDb.select().from(tableObj as never).where(clause)
        : await testDb.select().from(tableObj as never)
      return row ?? null
    },
    async findFirst({ where }: { where?: Record<string, unknown> } = {}) {
      if (where && Object.keys(where).length > 0) {
        const clause = buildWhere(tableObj as Record<string, unknown>, where)
        const [row] = clause
          ? await testDb.select().from(tableObj as never).where(clause).limit(1)
          : await testDb.select().from(tableObj as never).limit(1)
        return row ?? null
      }
      const [row] = await testDb.select().from(tableObj as never).limit(1)
      return row ?? null
    },
    async findMany({ where }: { where?: Record<string, unknown>, include?: unknown } = {}): Promise<unknown[]> {
      if (where && Object.keys(where).length > 0) {
        const clause = buildWhere(tableObj as Record<string, unknown>, where)
        return clause
          ? testDb.select().from(tableObj as never).where(clause)
          : testDb.select().from(tableObj as never)
      }
      return testDb.select().from(tableObj as never)
    },
    async create({ data }: { data: Record<string, unknown>, include?: unknown }): Promise<unknown> {
      const now = new Date().toISOString()
      const values: Record<string, unknown> = { ...data }
      // Convert Date objects to ISO strings
      for (const [k, v] of Object.entries(values)) {
        if (v instanceof Date) values[k] = v.toISOString()
      }
      // Add updatedAt if the table has it
      if ('updatedAt' in tableObj) values.updatedAt = now
      const rows = await testDb.insert(tableObj as never).values(values as never).returning() as unknown[]
      return rows[0]
    },
    async deleteMany({ where }: { where?: Record<string, unknown> } = {}): Promise<void> {
      if (where && Object.keys(where).length > 0) {
        const clause = buildWhere(tableObj as Record<string, unknown>, where)
        if (clause) {
          await testDb.delete(tableObj as never).where(clause)
          return
        }
      }
      await testDb.delete(tableObj as never)
    }
  }
}

// testPrisma compatibility wrapper — mirrors the Prisma API shape used in tests
export const testPrisma = {
  ingredient: makeApi(ingredient),
  item: makeApi(item),
  currency: makeApi(currency),
  person: makeApi(person),
  spell: makeApi(spell),
  skill: makeApi(skill),
  inventoryItem: makeApi(inventoryItem),
  // recipe needs special handling for `include: { ingredients: true }`
  recipe: {
    ...makeApi(recipe),
    async findUnique({ where, include }: { where: Record<string, unknown>, include?: { ingredients?: boolean } }): Promise<unknown> {
      const clause = buildWhere(recipe as unknown as Record<string, unknown>, where)
      const [row] = clause
        ? await testDb.select().from(recipe).where(clause)
        : await testDb.select().from(recipe)
      if (!row) return null
      if (include?.ingredients) {
        const ingredients = await testDb.select().from(recipeIngredient)
          .where(eq(recipeIngredient.recipeId, (row as { id: number }).id))
        return { ...row, ingredients }
      }
      return row
    }
  },
  recipeIngredient: makeApi(recipeIngredient),
  // potion needs special handling for `include: { inventoryItems: true }`
  potion: {
    ...makeApi(potion),
    async findFirst({ where, include }: { where?: Record<string, unknown>, include?: { inventoryItems?: boolean } } = {}): Promise<unknown> {
      const clause = where && Object.keys(where).length > 0
        ? buildWhere(potion as unknown as Record<string, unknown>, where)
        : undefined
      const [row] = clause
        ? await testDb.select().from(potion).where(clause).limit(1)
        : await testDb.select().from(potion).limit(1)
      if (!row) return null
      if (include?.inventoryItems) {
        const invItems = await testDb.select().from(potionInventoryItem)
          .where(eq(potionInventoryItem.potionId, (row as { id: number }).id))
        return { ...row, inventoryItems: invItems }
      }
      return row
    }
  },
  // potionInventoryItem needs special handling for `where: { potion: { recipeId, quality } }`
  potionInventoryItem: {
    ...makeApi(potionInventoryItem),
    async findMany({ where }: { where?: Record<string, unknown> } = {}): Promise<unknown[]> {
      if (where && 'potion' in where && where.potion && typeof where.potion === 'object') {
        const potionWhere = where.potion as { recipeId?: number; quality?: string }
        const conditions: ReturnType<typeof eq>[] = []
        if (potionWhere.recipeId !== undefined) conditions.push(eq(potion.recipeId, potionWhere.recipeId))
        if (potionWhere.quality !== undefined) conditions.push(eq(potion.quality, potionWhere.quality as never))
        const rows = await testDb.select({
          id: potionInventoryItem.id,
          createdAt: potionInventoryItem.createdAt,
          updatedAt: potionInventoryItem.updatedAt,
          potionId: potionInventoryItem.potionId,
          quantity: potionInventoryItem.quantity,
        }).from(potionInventoryItem)
          .innerJoin(potion, eq(potionInventoryItem.potionId, potion.id))
          .where(conditions.length === 1 ? conditions[0] : and(...conditions as never[]))
        return rows
      }
      if (where && Object.keys(where).length > 0) {
        const clause = buildWhere(potionInventoryItem as unknown as Record<string, unknown>, where)
        return clause
          ? testDb.select().from(potionInventoryItem).where(clause)
          : testDb.select().from(potionInventoryItem)
      }
      return testDb.select().from(potionInventoryItem)
    }
  },
  daySchedule: makeApi(daySchedule),
  scheduledTask: makeApi(scheduledTask),
  taskDefinition: makeApi(taskDefinition),

  // itemInventoryItem needs special handling for `include: { item: true }`
  itemInventoryItem: {
    ...makeApi(itemInventoryItem),
    async create({ data, include }: { data: Record<string, unknown>, include?: { item?: boolean } }): Promise<unknown> {
      const now = new Date().toISOString()
      const rows = await testDb.insert(itemInventoryItem).values({ ...data, updatedAt: now } as never).returning() as unknown[]
      const row = rows[0] as { itemId: number }
      if (include?.item) {
        const [itemRow] = await testDb.select().from(item).where(eq(item.id, row.itemId))
        return { ...row, item: itemRow }
      }
      return row
    }
  },

  // weekSchedule needs special handling for `include: { days: { include: { tasks: true } } }`
  weekSchedule: {
    ...makeApi(weekSchedule),
    async findUnique({ where, include }: {
      where: Record<string, unknown>,
      include?: { days?: { include?: { tasks?: boolean } } }
    }): Promise<unknown> {
      if (include?.days) {
        const result = await testDb.query.weekSchedule.findFirst({
          where: (ws, { eq: eqFn }) => eqFn(ws.id, where['id'] as number),
          with: include.days?.include?.tasks
            ? { days: { with: { tasks: true }, orderBy: (d: { day: unknown }, { asc }: { asc: (c: unknown) => unknown }) => [asc(d.day)] } }
            : { days: { orderBy: (d: { day: unknown }, { asc }: { asc: (c: unknown) => unknown }) => [asc(d.day)] } }
        })
        return result ?? null
      }
      const [row] = await testDb.select().from(weekSchedule).where(eq(weekSchedule.id, where['id'] as number))
      return row ?? null
    },
    async findMany({ where }: { where?: Record<string, unknown> } = {}): Promise<unknown[]> {
      if (where && Object.keys(where).length > 0) {
        const clause = buildWhere(weekSchedule as unknown as Record<string, unknown>, where)
        return clause
          ? testDb.select().from(weekSchedule).where(clause)
          : testDb.select().from(weekSchedule)
      }
      return testDb.select().from(weekSchedule)
    },
    async create({ data }: { data: Record<string, unknown> }): Promise<unknown> {
      const now = new Date().toISOString()
      const values: Record<string, unknown> = { ...data }
      for (const [k, v] of Object.entries(values)) {
        if (v instanceof Date) values[k] = v.toISOString()
      }
      values.updatedAt = now
      const [row] = await testDb.insert(weekSchedule).values(values as never).returning()
      return row
    },
    async deleteMany(): Promise<void> {
      await testDb.delete(weekSchedule)
    }
  },

  $connect: async () => {},
  $disconnect: async () => { await testPool.end() }
}

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
  await testDb.delete(recipeIngredient).catch(() => {})
  await testDb.delete(recipe).catch(() => {})
  await testDb.delete(ingredient).catch(() => {})
  await testDb.delete(item).catch(() => {})
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
        ALTER SEQUENCE "Skill_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "Spell_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "WeekSchedule_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "DaySchedule_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "ScheduledTask_id_seq" RESTART WITH 1;
        ALTER SEQUENCE "TaskDefinition_id_seq" RESTART WITH 1;
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
  notableEvents?: string | null
  url?: string | null
  isFavorited?: boolean
}) {
  const [row] = await testDb.insert(person).values({
    name: data.name,
    description: data.description ?? null,
    relationship: data.relationship ?? null,
    notableEvents: data.notableEvents ?? null,
    url: data.url ?? null,
    isFavorited: data.isFavorited ?? false,
    updatedAt: new Date().toISOString()
  }).returning()
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
