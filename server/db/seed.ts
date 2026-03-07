import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './index.js'
import {
  ingredient, inventoryItem, recipe, recipeIngredient, recipeCauldronVariant,
  potion, potionInventoryItem, item, itemInventoryItem, currency,
  person, skill, spell, taskDefinition,
  scheduledTask, daySchedule, weekSchedule
} from './index.js'
import { getDatabaseUrl } from '../utils/databaseUrls.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..', '..')

try { process.loadEnvFile(path.resolve(rootDir, '.env')) } catch { /* no .env is fine */ }

const { Pool } = pg
const pool = new Pool({ connectionString: getDatabaseUrl() })
const db = drizzle(pool, { schema })

const now = new Date().toISOString()

// ---------------------------------------------------------------------------
// Clear existing data (dependency order: children before parents)
// ---------------------------------------------------------------------------
console.log('Clearing existing data...')
await db.delete(scheduledTask)
await db.delete(daySchedule)
await db.delete(weekSchedule)
await db.delete(taskDefinition)
await db.delete(inventoryItem)
await db.delete(itemInventoryItem)
await db.delete(potionInventoryItem)
await db.delete(potion)
await db.delete(recipeCauldronVariant)
await db.delete(recipeIngredient)
await db.delete(recipe)
await db.delete(ingredient)
await db.delete(itemInventoryItem)
await db.delete(item)
await db.delete(currency)
await db.delete(person)
await db.delete(skill)
await db.delete(spell)

// ---------------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------------
console.log('Seeding ingredients...')
const ingredients = await db.insert(ingredient).values([
  // Regular brewing ingredients
  { name: 'Moonroot',            description: 'A silver-veined root found near still water at dusk. The most common base for healing and restorative brews.',                             secured: false, updatedAt: now },
  { name: 'Sunpetal',            description: 'Bright amber petals that intensify in direct sunlight. Adds warmth and vitality to any concoction.',                                      secured: false, updatedAt: now },
  { name: 'Dragon\'s Tongue',    description: 'A fiery red herb that thrives in volcanic soil. Dramatically amplifies a potion\'s physical potency.',                                    secured: false, updatedAt: now },
  { name: 'Ironweed',            description: 'Dense, iron-grey stalks that reinforce the physical constitution. Staple ingredient in strength and fortification brews.',                secured: false, updatedAt: now },
  { name: 'Starlight Nectar',   description: 'Luminescent sap harvested from moon-trees at dusk. Enhances mental clarity and arcane sensitivity.',                                      secured: false, updatedAt: now },
  { name: 'Silverbell Mushroom', description: 'A rare fungus with bell-shaped silver caps. Promotes clear thinking and guards against confusion effects.',                               secured: false, updatedAt: now },
  { name: 'Ashwort',             description: 'Pale ash-grey leaves from the deep marshes. Long used in shadow and concealment preparations.',                                           secured: false, updatedAt: now },
  { name: 'Serpent Root',        description: 'Dark, twisting roots dug from beneath serpent dens. Essential in stealth and misdirection brews.',                                       secured: false, updatedAt: now },
  { name: 'Thornbark',           description: 'Dried bark strips from the thornwood tree. Adds resilience and toughness to the drinker.',                                               secured: false, updatedAt: now },
  { name: 'Glowcap Mushroom',    description: 'Faintly bioluminescent caps found in deep forests. Useful in life-restoration and light-affinity brews.',                                secured: false, updatedAt: now },
  // Crystal Cauldron essence ingredients (secured — rare and valuable)
  { name: 'Fire Essence Crystal',      description: 'A shard of crystallized fire essence. Required by the Crystal Cauldron to imbue potions with FIRE affinity.',      secured: true, updatedAt: now },
  { name: 'Air Essence Crystal',       description: 'A weightless, shimmering crystal holding captured wind essence. Used for AIR-variant Crystal Cauldron crafting.',   secured: true, updatedAt: now },
  { name: 'Water Essence Crystal',     description: 'A cool blue crystal filled with contained water essence. Required for WATER-variant Crystal Cauldron crafting.',    secured: true, updatedAt: now },
  { name: 'Lightning Essence Crystal', description: 'A crackling amber crystal of stored lightning. Used for LIGHTNING-variant Crystal Cauldron crafting.',              secured: true, updatedAt: now },
  { name: 'Earth Essence Crystal',     description: 'A dense brown-green crystal of earth essence. Required for EARTH-variant Crystal Cauldron crafting.',              secured: true, updatedAt: now },
  { name: 'Life Essence Crystal',      description: 'A warm, pulsing rose crystal of pure life essence. Used for LIFE-variant Crystal Cauldron crafting.',             secured: true, updatedAt: now },
  { name: 'Death Essence Crystal',     description: 'A cold, obsidian fragment containing death essence. Required for DEATH-variant Crystal Cauldron crafting.',        secured: true, updatedAt: now },
]).returning()

const ing = Object.fromEntries(ingredients.map(i => [i.name, i]))

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------
console.log('Seeding recipes...')
const recipes = await db.insert(recipe).values([
  { name: 'Healing Tonic',   description: 'A reliable restorative potion used by adventurers across the realm. Closes minor wounds and restores energy.',  updatedAt: now },
  { name: 'Strength Draught', description: 'A robust brew that temporarily amplifies the drinker\'s physical power and endurance.',                         updatedAt: now },
  { name: 'Clarity Potion',  description: 'A luminescent brew that sharpens the mind and clears arcane fog, improving focus and spellcasting.',             updatedAt: now },
  { name: 'Shadow Veil',     description: 'A dark, odourless concoction that muffles the drinker\'s presence and dims their outline in low light.',         updatedAt: now },
]).returning()

const rec = Object.fromEntries(recipes.map(r => [r.name, r]))

// ---------------------------------------------------------------------------
// Recipe ingredients
// ---------------------------------------------------------------------------
console.log('Seeding recipe ingredients...')
await db.insert(recipeIngredient).values([
  // Healing Tonic: Moonroot x2, Sunpetal x1
  { recipeId: rec['Healing Tonic']!.id,    ingredientId: ing['Moonroot']!.id,            quantity: 2 },
  { recipeId: rec['Healing Tonic']!.id,    ingredientId: ing['Sunpetal']!.id,             quantity: 1 },
  // Strength Draught: Dragon's Tongue x1, Ironweed x2, Thornbark x1
  { recipeId: rec['Strength Draught']!.id, ingredientId: ing['Dragon\'s Tongue']!.id,     quantity: 1 },
  { recipeId: rec['Strength Draught']!.id, ingredientId: ing['Ironweed']!.id,             quantity: 2 },
  { recipeId: rec['Strength Draught']!.id, ingredientId: ing['Thornbark']!.id,            quantity: 1 },
  // Clarity Potion: Starlight Nectar x1, Silverbell Mushroom x2
  { recipeId: rec['Clarity Potion']!.id,   ingredientId: ing['Starlight Nectar']!.id,    quantity: 1 },
  { recipeId: rec['Clarity Potion']!.id,   ingredientId: ing['Silverbell Mushroom']!.id, quantity: 2 },
  // Shadow Veil: Ashwort x2, Serpent Root x1
  { recipeId: rec['Shadow Veil']!.id,      ingredientId: ing['Ashwort']!.id,              quantity: 2 },
  { recipeId: rec['Shadow Veil']!.id,      ingredientId: ing['Serpent Root']!.id,         quantity: 1 },
])

// ---------------------------------------------------------------------------
// Cauldron variants
// ---------------------------------------------------------------------------
console.log('Seeding cauldron variants...')
await db.insert(recipeCauldronVariant).values([
  // Healing Tonic variants
  { recipeId: rec['Healing Tonic']!.id, essenceType: 'FIRE', variantName: 'Blazing Healing Tonic',  essenceIngredientId: ing['Fire Essence Crystal']!.id,  updatedAt: now },
  { recipeId: rec['Healing Tonic']!.id, essenceType: 'LIFE', variantName: 'Vital Healing Tonic',    essenceIngredientId: ing['Life Essence Crystal']!.id,  updatedAt: now },
  // Strength Draught variants
  { recipeId: rec['Strength Draught']!.id, essenceType: 'EARTH',     variantName: 'Stone Strength Draught',   essenceIngredientId: ing['Earth Essence Crystal']!.id,     updatedAt: now },
  { recipeId: rec['Strength Draught']!.id, essenceType: 'LIGHTNING', variantName: 'Thunder Strength Draught', essenceIngredientId: ing['Lightning Essence Crystal']!.id, updatedAt: now },
  // Clarity Potion variants
  { recipeId: rec['Clarity Potion']!.id, essenceType: 'AIR',   variantName: 'Windborn Clarity Potion', essenceIngredientId: ing['Air Essence Crystal']!.id,   updatedAt: now },
  { recipeId: rec['Clarity Potion']!.id, essenceType: 'WATER', variantName: 'Crystal Clarity Potion', essenceIngredientId: ing['Water Essence Crystal']!.id, updatedAt: now },
  // Shadow Veil variant
  { recipeId: rec['Shadow Veil']!.id, essenceType: 'DEATH', variantName: 'Death-Kissed Shadow Veil', essenceIngredientId: ing['Death Essence Crystal']!.id, updatedAt: now },
])

// ---------------------------------------------------------------------------
// Ingredient inventory
// ---------------------------------------------------------------------------
console.log('Seeding inventory...')
await db.insert(inventoryItem).values([
  { ingredientId: ing['Moonroot']!.id,            quality: 'NORMAL', quantity: 5,  updatedAt: now },
  { ingredientId: ing['Moonroot']!.id,            quality: 'HQ',     quantity: 2,  updatedAt: now },
  { ingredientId: ing['Sunpetal']!.id,             quality: 'NORMAL', quantity: 3,  updatedAt: now },
  { ingredientId: ing['Dragon\'s Tongue']!.id,     quality: 'NORMAL', quantity: 4,  updatedAt: now },
  { ingredientId: ing['Dragon\'s Tongue']!.id,     quality: 'LQ',     quantity: 1,  updatedAt: now },
  { ingredientId: ing['Ironweed']!.id,             quality: 'NORMAL', quantity: 6,  updatedAt: now },
  { ingredientId: ing['Starlight Nectar']!.id,    quality: 'HQ',     quantity: 2,  updatedAt: now },
  { ingredientId: ing['Silverbell Mushroom']!.id, quality: 'NORMAL', quantity: 3,  updatedAt: now },
  { ingredientId: ing['Silverbell Mushroom']!.id, quality: 'LQ',     quantity: 2,  updatedAt: now },
  { ingredientId: ing['Ashwort']!.id,              quality: 'NORMAL', quantity: 5,  updatedAt: now },
  { ingredientId: ing['Serpent Root']!.id,         quality: 'NORMAL', quantity: 2,  updatedAt: now },
  { ingredientId: ing['Thornbark']!.id,            quality: 'NORMAL', quantity: 3,  updatedAt: now },
  { ingredientId: ing['Glowcap Mushroom']!.id,    quality: 'NORMAL', quantity: 2,  updatedAt: now },
  // Essence crystals
  { ingredientId: ing['Fire Essence Crystal']!.id,      quality: 'NORMAL', quantity: 2, updatedAt: now },
  { ingredientId: ing['Air Essence Crystal']!.id,       quality: 'NORMAL', quantity: 1, updatedAt: now },
  { ingredientId: ing['Water Essence Crystal']!.id,     quality: 'NORMAL', quantity: 3, updatedAt: now },
  { ingredientId: ing['Earth Essence Crystal']!.id,     quality: 'NORMAL', quantity: 2, updatedAt: now },
  { ingredientId: ing['Life Essence Crystal']!.id,      quality: 'NORMAL', quantity: 1, updatedAt: now },
])

// ---------------------------------------------------------------------------
// Potions (pre-crafted stock)
// ---------------------------------------------------------------------------
console.log('Seeding potions...')
const potions = await db.insert(potion).values([
  { recipeId: rec['Healing Tonic']!.id,  quality: 'NORMAL', cauldronName: null,                     updatedAt: now },
  { recipeId: rec['Healing Tonic']!.id,  quality: 'HQ',     cauldronName: null,                     updatedAt: now },
  { recipeId: rec['Healing Tonic']!.id,  quality: 'NORMAL', cauldronName: 'Blazing Healing Tonic',  updatedAt: now },
  { recipeId: rec['Clarity Potion']!.id, quality: 'NORMAL', cauldronName: null,                     updatedAt: now },
]).returning()

await db.insert(potionInventoryItem).values([
  { potionId: potions[0]!.id, quantity: 3, updatedAt: now },
  { potionId: potions[1]!.id, quantity: 1, updatedAt: now },
  { potionId: potions[2]!.id, quantity: 2, updatedAt: now },
  { potionId: potions[3]!.id, quantity: 1, updatedAt: now },
])

// ---------------------------------------------------------------------------
// Items & item inventory
// ---------------------------------------------------------------------------
console.log('Seeding items...')
const items = await db.insert(item).values([
  { name: 'Empty Vial',             description: 'Standard glass vials for storing potions and tinctures.',                                        updatedAt: now },
  { name: 'Alchemist\'s Satchel',    description: 'A well-worn leather bag with many padded compartments, perfect for transporting fragile materials.', updatedAt: now },
  { name: 'Mortar and Pestle',      description: 'A sturdy stone set for grinding and combining ingredients. Essential workshop equipment.',         updatedAt: now },
  { name: 'Thornwood Dowsing Rod',  description: 'A rod carved from thornwood that faintly hums near rare plants and hidden herb caches.',           updatedAt: now },
]).returning()

await db.insert(itemInventoryItem).values([
  { itemId: items[0]!.id, quantity: 10, updatedAt: now },
  { itemId: items[1]!.id, quantity: 2,  updatedAt: now },
  { itemId: items[2]!.id, quantity: 1,  updatedAt: now },
  { itemId: items[3]!.id, quantity: 1,  updatedAt: now },
])

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------
console.log('Seeding currency...')
await db.insert(currency).values([
  { name: 'Gold',   value: 250, updatedAt: now },
  { name: 'Silver', value: 75,  updatedAt: now },
])

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
console.log('Seeding people...')
await db.insert(person).values([
  {
    name: 'Elysia Dawnbreaker',
    description: 'The town\'s renowned healer and alchemist. Warm, patient, and possessed of an encyclopedic knowledge of medicinal herbs. She trained half the apothecaries in the region.',
    relationship: 'Mentor and trusted colleague',
    notableEvents: 'Provided rare Glowcap Mushrooms at no charge during the fever outbreak. Taught advanced distillation techniques.',
    url: null,
    isFavorited: true,
    updatedAt: now,
  },
  {
    name: 'Garron Ashsmith',
    description: 'The town blacksmith and former soldier. Gruff exterior, deeply loyal to those who earn his trust. Has an unusual interest in alchemical coatings for weapons.',
    relationship: 'Occasional client and dependable ally',
    notableEvents: 'Forged a custom distillation stand in exchange for a batch of Strength Draughts. Reliable in a crisis.',
    url: null,
    isFavorited: false,
    updatedAt: now,
  },
  {
    name: 'Lady Vesper',
    description: 'A mysterious noble with rumoured connections to shadow guilds and the city council. Dangerous to cross, invaluable to know. Always polite, never trustworthy.',
    relationship: 'Ambiguous patron',
    notableEvents: 'Commissioned a large order of Shadow Veils. Paid well above market rate. No questions asked — which raises questions.',
    url: null,
    isFavorited: false,
    updatedAt: now,
  },
  {
    name: 'Thorne',
    description: 'A well-traveled merchant specializing in rare ingredients, unusual cargo, and information. Charming, evasive, and surprisingly well-connected.',
    relationship: 'Supplier and informant',
    notableEvents: 'Primary source for essence crystals. Has never failed a delivery. Named his price in favours as often as coin.',
    url: null,
    isFavorited: true,
    updatedAt: now,
  },
  {
    name: 'Mirela Stoneleaf',
    description: 'A reclusive herbalist living deep in the Greenwood. Knows plants that don\'t appear in any published almanac. Speaks sparingly; every word counts.',
    relationship: 'Knowledgeable contact',
    notableEvents: 'Identified the Thornwood Dowsing Rod\'s properties. Occasionally leaves rare herb bundles at the workshop door with no note.',
    url: null,
    isFavorited: false,
    updatedAt: now,
  },
  {
    name: 'Captain Aldric',
    description: 'Commander of the town guard. By-the-book, suspicious of alchemists by default, but respectful when shown concrete results. Values practical outcomes over elegance.',
    relationship: 'Uneasy authority figure',
    notableEvents: 'Accepted a batch of Healing Tonics for the garrison after the border skirmish. Hasn\'t caused trouble since.',
    url: null,
    isFavorited: false,
    updatedAt: now,
  },
])

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------
console.log('Seeding skills...')
await db.insert(skill).values([
  { name: 'Alchemy',       updatedAt: now },
  { name: 'Herbalism',     updatedAt: now },
  { name: 'Negotiation',   updatedAt: now },
  { name: 'Arcane Theory', updatedAt: now },
  { name: 'Stealth',       updatedAt: now },
  { name: 'First Aid',     updatedAt: now },
])

// ---------------------------------------------------------------------------
// Spells
// ---------------------------------------------------------------------------
console.log('Seeding spells...')
await db.insert(spell).values([
  { name: 'Fireball',      currentStars: 3, neededStars: 3, isLearned: true,  updatedAt: now },
  { name: 'Healing Touch', currentStars: 2, neededStars: 2, isLearned: true,  updatedAt: now },
  { name: 'Arcane Shield', currentStars: 3, neededStars: 5, isLearned: false, updatedAt: now },
  { name: 'Shadow Step',   currentStars: 1, neededStars: 3, isLearned: false, updatedAt: now },
  { name: 'Ice Lance',     currentStars: 0, neededStars: 4, isLearned: false, updatedAt: now },
])

// ---------------------------------------------------------------------------
// Task definitions (one per task type)
// ---------------------------------------------------------------------------
console.log('Seeding task definitions...')
await db.insert(taskDefinition).values([
  { type: 'GATHER_INGREDIENT', name: 'Gathering Run',    timeUnits: 2, color: '#16a34a', description: 'Head out to gather ingredients from the field, forest, or market.',    restrictions: null, updatedAt: now },
  { type: 'BREWING',           name: 'Brewing Session',  timeUnits: 3, color: '#7c3aed', description: 'Spend time at the workbench crafting potions from available stock.',   restrictions: null, updatedAt: now },
  { type: 'SECURE_INGREDIENTS',name: 'Securing Stock',   timeUnits: 1, color: '#d97706', description: 'Lock down and catalogue secured ingredients to prevent loss or theft.', restrictions: null, updatedAt: now },
  { type: 'RESEARCH_RECIPES',  name: 'Recipe Research',  timeUnits: 2, color: '#2563eb', description: 'Study tomes and experiment to discover or refine potion recipes.',      restrictions: null, updatedAt: now },
  { type: 'RESEARCH_SPELL',    name: 'Spell Study',      timeUnits: 3, color: '#db2777', description: 'Focused arcane study to advance progress toward learning a new spell.', restrictions: null, updatedAt: now },
  { type: 'FREE_TIME',         name: 'Free Time',        timeUnits: 1, color: '#6b7280', description: 'Unscheduled time for rest, errands, or unexpected opportunities.',      restrictions: null, updatedAt: now },
])

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------
console.log('\nSeed complete.')
console.log(`  ${ingredients.length} ingredients`)
console.log(`  ${recipes.length} recipes with ingredients and cauldron variants`)
console.log(`  ${potions.length} potion types in inventory`)
console.log(`  ${items.length} items`)
console.log('  2 currencies (Gold, Silver)')
console.log('  6 people')
console.log('  6 skills')
console.log('  5 spells')
console.log('  6 task definitions')

await pool.end()
