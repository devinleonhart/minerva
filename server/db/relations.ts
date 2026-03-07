import { relations } from 'drizzle-orm/relations'
import { ingredient, inventoryItem, potion, potionInventoryItem, weekSchedule, daySchedule, scheduledTask, item, itemInventoryItem, recipe, recipeIngredient, recipeCauldronVariant } from './schema.js'

export const inventoryItemRelations = relations(inventoryItem, ({one}) => ({
  ingredient: one(ingredient, {
    fields: [inventoryItem.ingredientId],
    references: [ingredient.id]
  }),
}))

export const ingredientRelations = relations(ingredient, ({many}) => ({
  inventoryItems: many(inventoryItem),
  recipeIngredients: many(recipeIngredient),
  cauldronVariants: many(recipeCauldronVariant),
}))

export const potionInventoryItemRelations = relations(potionInventoryItem, ({one}) => ({
  potion: one(potion, {
    fields: [potionInventoryItem.potionId],
    references: [potion.id]
  }),
}))

export const potionRelations = relations(potion, ({one, many}) => ({
  inventoryItems: many(potionInventoryItem),
  recipe: one(recipe, {
    fields: [potion.recipeId],
    references: [recipe.id]
  }),
}))

export const dayScheduleRelations = relations(daySchedule, ({one, many}) => ({
  weekSchedule: one(weekSchedule, {
    fields: [daySchedule.weekScheduleId],
    references: [weekSchedule.id]
  }),
  tasks: many(scheduledTask),
}))

export const weekScheduleRelations = relations(weekSchedule, ({many}) => ({
  days: many(daySchedule),
}))

export const scheduledTaskRelations = relations(scheduledTask, ({one}) => ({
  daySchedule: one(daySchedule, {
    fields: [scheduledTask.dayScheduleId],
    references: [daySchedule.id]
  }),
}))

export const itemInventoryItemRelations = relations(itemInventoryItem, ({one}) => ({
  item: one(item, {
    fields: [itemInventoryItem.itemId],
    references: [item.id]
  }),
}))

export const itemRelations = relations(item, ({many}) => ({
  itemInventoryItems: many(itemInventoryItem),
}))

export const recipeIngredientRelations = relations(recipeIngredient, ({one}) => ({
  recipe: one(recipe, {
    fields: [recipeIngredient.recipeId],
    references: [recipe.id]
  }),
  ingredient: one(ingredient, {
    fields: [recipeIngredient.ingredientId],
    references: [ingredient.id]
  }),
}))

export const recipeCauldronVariantRelations = relations(recipeCauldronVariant, ({one}) => ({
  recipe: one(recipe, {
    fields: [recipeCauldronVariant.recipeId],
    references: [recipe.id]
  }),
  essenceIngredient: one(ingredient, {
    fields: [recipeCauldronVariant.essenceIngredientId],
    references: [ingredient.id]
  }),
}))

export const recipeRelations = relations(recipe, ({many}) => ({
  ingredients: many(recipeIngredient),
  potions: many(potion),
  cauldronVariants: many(recipeCauldronVariant),
}))
