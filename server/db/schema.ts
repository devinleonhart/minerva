import { pgTable, varchar, timestamp, text, integer, uniqueIndex, serial, jsonb, boolean, foreignKey, primaryKey, pgEnum } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const ingredientQuality = pgEnum('IngredientQuality', ['NORMAL', 'HQ', 'LQ'])
export const potionQuality = pgEnum('PotionQuality', ['NORMAL', 'HQ', 'LQ'])
export const taskType = pgEnum('TaskType', ['GATHER_INGREDIENT', 'BREWING', 'SECURE_INGREDIENTS', 'RESEARCH_RECIPES', 'RESEARCH_SPELL', 'FREE_TIME'])
export const timeSlot = pgEnum('TimeSlot', ['MORNING', 'AFTERNOON', 'EVENING'])


export const prismaMigrations = pgTable('_prisma_migrations', {
  id: varchar({ length: 36 }).primaryKey().notNull(),
  checksum: varchar({ length: 64 }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'string' }),
  migrationName: varchar('migration_name', { length: 255 }).notNull(),
  logs: text(),
  rolledBackAt: timestamp('rolled_back_at', { withTimezone: true, mode: 'string' }),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  appliedStepsCount: integer('applied_steps_count').default(0).notNull(),
})

export const taskDefinition = pgTable('TaskDefinition', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  type: taskType().notNull(),
  name: varchar({ length: 100 }).notNull(),
  timeUnits: integer().notNull(),
  color: varchar({ length: 7 }).notNull(),
  description: text().notNull(),
  restrictions: jsonb(),
}, (table) => [
  uniqueIndex('TaskDefinition_type_key').using('btree', table.type.asc().nullsLast().op('enum_ops')),
])

export const ingredient = pgTable('Ingredient', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  description: text().notNull(),
  name: varchar({ length: 255 }).notNull(),
  secured: boolean().default(false).notNull(),
})

export const inventoryItem = pgTable('InventoryItem', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  ingredientId: integer().notNull(),
  quality: ingredientQuality().default('NORMAL').notNull(),
  quantity: integer().default(1).notNull(),
}, (table) => [
  foreignKey({
    columns: [table.ingredientId],
    foreignColumns: [ingredient.id],
    name: 'InventoryItem_ingredientId_fkey'
  }).onUpdate('cascade').onDelete('restrict'),
])

export const potion = pgTable('Potion', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  quality: potionQuality().default('NORMAL').notNull(),
  recipeId: integer().notNull(),
  cauldronName: text(),
  cauldronDescription: text(),
})

export const potionInventoryItem = pgTable('PotionInventoryItem', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  potionId: integer().notNull(),
  quantity: integer().default(1).notNull(),
}, (table) => [
  foreignKey({
    columns: [table.potionId],
    foreignColumns: [potion.id],
    name: 'PotionInventoryItem_potionId_fkey'
  }).onUpdate('cascade').onDelete('restrict'),
])

export const item = pgTable('Item', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
})

export const weekSchedule = pgTable('WeekSchedule', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  weekStartDate: timestamp({ precision: 3, mode: 'string' }).notNull(),
  totalScheduledUnits: integer().default(0).notNull(),
  freeTimeUsed: boolean().default(false).notNull(),
}, (table) => [
  uniqueIndex('WeekSchedule_weekStartDate_key').using('btree', table.weekStartDate.asc().nullsLast().op('timestamp_ops')),
])

export const daySchedule = pgTable('DaySchedule', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  weekScheduleId: integer().notNull(),
  day: integer().notNull(),
  dayName: varchar({ length: 20 }).notNull(),
  totalUnits: integer().default(0).notNull(),
}, (table) => [
  uniqueIndex('DaySchedule_weekScheduleId_day_key').using('btree', table.weekScheduleId.asc().nullsLast().op('int4_ops'), table.day.asc().nullsLast().op('int4_ops')),
  foreignKey({
    columns: [table.weekScheduleId],
    foreignColumns: [weekSchedule.id],
    name: 'DaySchedule_weekScheduleId_fkey'
  }).onUpdate('cascade').onDelete('cascade'),
])

export const scheduledTask = pgTable('ScheduledTask', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  type: taskType().notNull(),
  timeUnits: integer().notNull(),
  day: integer().notNull(),
  timeSlot: timeSlot().notNull(),
  details: jsonb(),
  dayScheduleId: integer().notNull(),
  notes: text(),
}, (table) => [
  uniqueIndex('ScheduledTask_dayScheduleId_timeSlot_key').using('btree', table.dayScheduleId.asc().nullsLast().op('int4_ops'), table.timeSlot.asc().nullsLast().op('int4_ops')),
  foreignKey({
    columns: [table.dayScheduleId],
    foreignColumns: [daySchedule.id],
    name: 'ScheduledTask_dayScheduleId_fkey'
  }).onUpdate('cascade').onDelete('cascade'),
])

export const currency = pgTable('Currency', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  value: integer().default(0).notNull(),
}, (table) => [
  uniqueIndex('Currency_name_key').using('btree', table.name.asc().nullsLast().op('text_ops')),
])

export const itemInventoryItem = pgTable('ItemInventoryItem', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  itemId: integer().notNull(),
  quantity: integer().default(0).notNull(),
}, (table) => [
  foreignKey({
    columns: [table.itemId],
    foreignColumns: [item.id],
    name: 'ItemInventoryItem_itemId_fkey'
  }).onUpdate('cascade').onDelete('restrict'),
])

export const person = pgTable('Person', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  relationship: varchar({ length: 255 }),
  url: varchar({ length: 255 }),
  isFavorited: boolean().default(false).notNull(),
})

export const personNotableEvent = pgTable('PersonNotableEvent', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  personId: integer().notNull(),
  description: text().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.personId],
    foreignColumns: [person.id],
    name: 'PersonNotableEvent_personId_fkey'
  }).onUpdate('cascade').onDelete('cascade'),
])

export const recipe = pgTable('Recipe', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
})

export const skill = pgTable('Skill', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  name: varchar({ length: 255 }).notNull(),
}, (table) => [
  uniqueIndex('Skill_name_key').using('btree', table.name.asc().nullsLast().op('text_ops')),
])

export const spell = pgTable('Spell', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  currentStars: integer().default(0).notNull(),
  neededStars: integer().default(1).notNull(),
  isLearned: boolean().default(false).notNull(),
}, (table) => [
  uniqueIndex('Spell_name_key').using('btree', table.name.asc().nullsLast().op('text_ops')),
])

export const recipeCauldronVariant = pgTable('RecipeCauldronVariant', {
  id: serial().primaryKey().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  recipeId: integer().notNull(),
  essenceType: varchar({ length: 20 }).notNull(),
  variantName: varchar({ length: 255 }).notNull(),
  description: text(),
  essenceIngredientId: integer().notNull(),
}, (table) => [
  uniqueIndex('RecipeCauldronVariant_recipeId_essenceType_key').using('btree', table.recipeId.asc().nullsLast().op('int4_ops'), table.essenceType.asc().nullsLast().op('text_ops')),
  foreignKey({
    columns: [table.recipeId],
    foreignColumns: [recipe.id],
    name: 'RecipeCauldronVariant_recipeId_fkey'
  }).onUpdate('cascade').onDelete('cascade'),
  foreignKey({
    columns: [table.essenceIngredientId],
    foreignColumns: [ingredient.id],
    name: 'RecipeCauldronVariant_essenceIngredientId_fkey'
  }).onUpdate('cascade').onDelete('restrict'),
])

export const recipeIngredient = pgTable('RecipeIngredient', {
  recipeId: integer().notNull(),
  ingredientId: integer().notNull(),
  quantity: integer().default(1).notNull(),
}, (table) => [
  foreignKey({
    columns: [table.recipeId],
    foreignColumns: [recipe.id],
    name: 'RecipeIngredient_recipeId_fkey'
  }).onUpdate('cascade').onDelete('restrict'),
  foreignKey({
    columns: [table.ingredientId],
    foreignColumns: [ingredient.id],
    name: 'RecipeIngredient_ingredientId_fkey'
  }).onUpdate('cascade').onDelete('restrict'),
  primaryKey({ columns: [table.recipeId, table.ingredientId], name: 'RecipeIngredient_pkey'}),
])
