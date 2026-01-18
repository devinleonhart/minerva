import { PrismaClient, DaySchedule } from '../src/generated/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { getPrimaryDatabaseUrl } from '../src/config/databaseUrls.js'

const { Pool } = pg

const connectionString = getPrimaryDatabaseUrl()
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
  console.log('Seeding ingredients...')

  const ingredientData = [
    // Healing / Restorative
    {
      name: 'Sunset Lotus',
      description: 'A radiant blossom that absorbs evening sunlight, amplifying restorative potions.',
      secured: true
    },
    {
      name: 'Goldleaf Petals',
      description: 'Delicate golden petals prized for their regenerative properties.',
      secured: false
    },
    {
      name: 'Phoenix Feather Ash',
      description: 'Rare ash from molted phoenix feathers, grants potent revival effects.',
      secured: true
    },

    // Cold / Calming
    {
      name: 'Frostvine Sap',
      description: 'Thick, chilled sap that adds calming properties and frost resistance.',
      secured: false
    },
    {
      name: 'Glacier Mint',
      description: 'Mint grown in frozen caves, provides cooling and mental clarity.',
      secured: false
    },
    {
      name: 'Snowdrop Essence',
      description: 'Distilled from alpine snowdrops, soothes inflammation and fever.',
      secured: false
    },

    // Fire / Aggressive
    {
      name: 'Dragon Pepper',
      description: 'Scalding peppercorn that ignites aggressive effects and battle focus.',
      secured: false
    },
    {
      name: 'Emberroot',
      description: 'Root that smolders when exposed to air, adds burning damage to potions.',
      secured: false
    },
    {
      name: 'Volcanic Salt',
      description: 'Crystallized salt from volcanic vents, intensifies all fire effects.',
      secured: true
    },

    // Magical / Arcane
    {
      name: 'Moonstone Dust',
      description: 'Powdered crystal that heightens clarity and magical attunement.',
      secured: false
    },
    {
      name: 'Starlight Dew',
      description: 'Dew collected under starlight, enhances spell potency.',
      secured: true
    },
    {
      name: 'Void Spores',
      description: 'Mysterious spores from the shadow realm, adds unpredictable magical effects.',
      secured: true
    },
    {
      name: 'Arcane Crystal Shards',
      description: 'Fragments of pure crystallized mana, amplifies all magical properties.',
      secured: true
    },

    // Stealth / Utility
    {
      name: 'Whisper Reed',
      description: 'Delicate reed that carries lingering scents for invisibility brews.',
      secured: false
    },
    {
      name: 'Shadow Moss',
      description: 'Moss that grows only in complete darkness, grants stealth properties.',
      secured: false
    },
    {
      name: 'Chameleon Scales',
      description: 'Shed scales from magical chameleons, enables color-shifting effects.',
      secured: false
    },

    // Earth / Nature
    {
      name: 'Ancient Oak Bark',
      description: 'Bark from centuries-old oaks, provides fortification and endurance.',
      secured: false
    },
    {
      name: 'Earthworm Extract',
      description: 'Concentrated extract that grounds magical effects and adds stability.',
      secured: false
    },
    {
      name: 'Crystal Honey',
      description: 'Honey from bees that feed on magical flowers, sweet binding agent.',
      secured: false
    },

    // Poison / Dark
    {
      name: 'Nightshade Berries',
      description: 'Toxic berries used in small doses for numbing and paralysis effects.',
      secured: true
    },
    {
      name: 'Serpent Venom',
      description: 'Extracted venom that adds poison damage or antivenom properties.',
      secured: true
    },
    {
      name: 'Deathcap Powder',
      description: 'Ground deadly mushroom, extremely potent in curse potions.',
      secured: true
    }
  ]

  await prisma.ingredient.createMany({ data: ingredientData })
  console.log(`Created ${ingredientData.length} ingredients.`)
}

async function seedRecipes() {
  console.log('Seeding recipes...')

  const ingredients = await prisma.ingredient.findMany()
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.name, ingredient.id]))

  const recipeSeeds = [
    // Healing Potions
    {
      name: 'Radiant Renewal',
      description: 'Restorative draught that rapidly knits wounds while boosting morale.',
      cauldronName: 'Solar Mend',
      fireEssence: 'Cauterizes wounds instantly',
      lifeEssence: 'Doubles healing over time',
      ingredients: [
        { name: 'Sunset Lotus', quantity: 2 },
        { name: 'Moonstone Dust', quantity: 1 },
        { name: 'Crystal Honey', quantity: 1 }
      ]
    },
    {
      name: 'Phoenix Tears',
      description: 'Legendary healing potion that can revive from the brink of death.',
      cauldronName: 'Rebirth Elixir',
      fireEssence: 'Adds temporary fire immunity',
      lifeEssence: 'Full health restoration',
      deathEssence: 'Prevents death once',
      ingredients: [
        { name: 'Phoenix Feather Ash', quantity: 1 },
        { name: 'Goldleaf Petals', quantity: 3 },
        { name: 'Starlight Dew', quantity: 2 }
      ]
    },
    {
      name: 'Mender\'s Salve',
      description: 'Quick-acting wound treatment for minor injuries.',
      ingredients: [
        { name: 'Goldleaf Petals', quantity: 2 },
        { name: 'Crystal Honey', quantity: 1 }
      ]
    },

    // Cold/Clarity Potions
    {
      name: 'Chilling Clarity',
      description: 'Frosty tonic that clears the mind and dampens emotional surges.',
      cauldronName: 'Frozen Mind',
      waterEssence: 'Extends duration significantly',
      airEssence: 'Adds thought-speed bonus',
      ingredients: [
        { name: 'Frostvine Sap', quantity: 2 },
        { name: 'Glacier Mint', quantity: 1 },
        { name: 'Whisper Reed', quantity: 1 }
      ]
    },
    {
      name: 'Fever Break',
      description: 'Cooling potion that eliminates fever and reduces inflammation.',
      ingredients: [
        { name: 'Snowdrop Essence', quantity: 2 },
        { name: 'Glacier Mint', quantity: 1 }
      ]
    },

    // Combat Potions
    {
      name: 'Inferno Tonic',
      description: 'Aggressive brew that enhances physical prowess at the cost of calm.',
      cauldronName: 'Berserker\'s Fury',
      fireEssence: 'Adds fire damage to attacks',
      earthEssence: 'Reduces self-damage taken',
      ingredients: [
        { name: 'Dragon Pepper', quantity: 3 },
        { name: 'Emberroot', quantity: 2 },
        { name: 'Volcanic Salt', quantity: 1 }
      ]
    },
    {
      name: 'Stone Skin',
      description: 'Fortifying draught that hardens skin against physical attacks.',
      cauldronName: 'Iron Hide',
      earthEssence: 'Doubles armor bonus',
      waterEssence: 'Adds magic resistance',
      ingredients: [
        { name: 'Ancient Oak Bark', quantity: 3 },
        { name: 'Earthworm Extract', quantity: 2 },
        { name: 'Volcanic Salt', quantity: 1 }
      ]
    },

    // Stealth Potions
    {
      name: 'Phantom Veil',
      description: 'Renders the drinker nearly invisible for a short duration.',
      cauldronName: 'Ghost Walk',
      airEssence: 'Adds silent movement',
      deathEssence: 'Can pass through thin walls',
      ingredients: [
        { name: 'Whisper Reed', quantity: 2 },
        { name: 'Shadow Moss', quantity: 2 },
        { name: 'Moonstone Dust', quantity: 1 }
      ]
    },
    {
      name: 'Chameleon Draught',
      description: 'Allows skin to blend with surroundings, providing camouflage.',
      ingredients: [
        { name: 'Chameleon Scales', quantity: 2 },
        { name: 'Shadow Moss', quantity: 1 },
        { name: 'Crystal Honey', quantity: 1 }
      ]
    },

    // Magic Potions
    {
      name: 'Arcane Surge',
      description: 'Dramatically boosts magical power for a brief window.',
      cauldronName: 'Mana Overflow',
      lightningEssence: 'Instant cast next spell',
      airEssence: 'Reduces spell cooldowns',
      ingredients: [
        { name: 'Arcane Crystal Shards', quantity: 2 },
        { name: 'Starlight Dew', quantity: 2 },
        { name: 'Moonstone Dust', quantity: 1 }
      ]
    },
    {
      name: 'Void Touch',
      description: 'Mysterious potion with unpredictable but powerful magical effects.',
      cauldronName: 'Chaos Brew',
      deathEssence: 'Guaranteed powerful effect',
      lifeEssence: 'Removes negative outcomes',
      ingredients: [
        { name: 'Void Spores', quantity: 2 },
        { name: 'Arcane Crystal Shards', quantity: 1 },
        { name: 'Nightshade Berries', quantity: 1 }
      ]
    },

    // Poison/Antidote
    {
      name: 'Universal Antidote',
      description: 'Cures most known poisons and venoms.',
      lifeEssence: 'Also cures diseases',
      waterEssence: 'Prevents future poisoning briefly',
      ingredients: [
        { name: 'Serpent Venom', quantity: 1 },
        { name: 'Goldleaf Petals', quantity: 2 },
        { name: 'Crystal Honey', quantity: 2 }
      ]
    },
    {
      name: 'Assassin\'s Kiss',
      description: 'Deadly contact poison that acts within minutes.',
      deathEssence: 'Instant effect',
      ingredients: [
        { name: 'Deathcap Powder', quantity: 2 },
        { name: 'Serpent Venom', quantity: 1 },
        { name: 'Nightshade Berries', quantity: 2 }
      ]
    },

    // Utility Potions
    {
      name: 'Endurance Elixir',
      description: 'Eliminates fatigue and extends stamina for long journeys.',
      ingredients: [
        { name: 'Ancient Oak Bark', quantity: 2 },
        { name: 'Dragon Pepper', quantity: 1 },
        { name: 'Crystal Honey', quantity: 1 }
      ]
    },
    {
      name: 'Night Vision',
      description: 'Allows perfect sight in complete darkness.',
      ingredients: [
        { name: 'Shadow Moss', quantity: 2 },
        { name: 'Moonstone Dust', quantity: 1 }
      ]
    }
  ]

  for (const recipe of recipeSeeds) {
    await prisma.recipe.create({
      data: {
        name: recipe.name,
        description: recipe.description,
        cauldronName: recipe.cauldronName || null,
        fireEssence: recipe.fireEssence || null,
        airEssence: recipe.airEssence || null,
        waterEssence: recipe.waterEssence || null,
        lightningEssence: recipe.lightningEssence || null,
        earthEssence: recipe.earthEssence || null,
        lifeEssence: recipe.lifeEssence || null,
        deathEssence: recipe.deathEssence || null,
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

  console.log(`Created ${recipeSeeds.length} recipes.`)
}

async function seedIngredientInventory() {
  console.log('Seeding ingredient inventory...')

  const ingredients = await prisma.ingredient.findMany()
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.name, ingredient.id]))

  const inventorySeeds = [
    // Well-stocked common ingredients
    { name: 'Sunset Lotus', quality: 'NORMAL' as const, quantity: 8 },
    { name: 'Sunset Lotus', quality: 'HQ' as const, quantity: 3 },
    { name: 'Frostvine Sap', quality: 'NORMAL' as const, quantity: 12 },
    { name: 'Frostvine Sap', quality: 'HQ' as const, quantity: 4 },
    { name: 'Dragon Pepper', quality: 'NORMAL' as const, quantity: 10 },
    { name: 'Dragon Pepper', quality: 'LQ' as const, quantity: 5 },
    { name: 'Moonstone Dust', quality: 'NORMAL' as const, quantity: 6 },
    { name: 'Moonstone Dust', quality: 'HQ' as const, quantity: 2 },
    { name: 'Moonstone Dust', quality: 'LQ' as const, quantity: 4 },
    { name: 'Whisper Reed', quality: 'NORMAL' as const, quantity: 15 },
    { name: 'Crystal Honey', quality: 'NORMAL' as const, quantity: 20 },
    { name: 'Crystal Honey', quality: 'HQ' as const, quantity: 5 },

    // Moderate stock
    { name: 'Goldleaf Petals', quality: 'NORMAL' as const, quantity: 6 },
    { name: 'Goldleaf Petals', quality: 'HQ' as const, quantity: 2 },
    { name: 'Glacier Mint', quality: 'NORMAL' as const, quantity: 8 },
    { name: 'Snowdrop Essence', quality: 'NORMAL' as const, quantity: 5 },
    { name: 'Emberroot', quality: 'NORMAL' as const, quantity: 7 },
    { name: 'Shadow Moss', quality: 'NORMAL' as const, quantity: 9 },
    { name: 'Ancient Oak Bark', quality: 'NORMAL' as const, quantity: 11 },
    { name: 'Earthworm Extract', quality: 'NORMAL' as const, quantity: 8 },

    // Low stock rare ingredients
    { name: 'Phoenix Feather Ash', quality: 'HQ' as const, quantity: 1 },
    { name: 'Volcanic Salt', quality: 'NORMAL' as const, quantity: 3 },
    { name: 'Starlight Dew', quality: 'HQ' as const, quantity: 2 },
    { name: 'Void Spores', quality: 'NORMAL' as const, quantity: 2 },
    { name: 'Arcane Crystal Shards', quality: 'NORMAL' as const, quantity: 3 },
    { name: 'Arcane Crystal Shards', quality: 'HQ' as const, quantity: 1 },
    { name: 'Chameleon Scales', quality: 'NORMAL' as const, quantity: 4 },

    // Poison ingredients (secured)
    { name: 'Nightshade Berries', quality: 'NORMAL' as const, quantity: 6 },
    { name: 'Serpent Venom', quality: 'NORMAL' as const, quantity: 3 },
    { name: 'Serpent Venom', quality: 'HQ' as const, quantity: 1 },
    { name: 'Deathcap Powder', quality: 'NORMAL' as const, quantity: 2 }
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

  console.log(`Created ${inventorySeeds.length} ingredient inventory items.`)
}

async function seedItems() {
  console.log('Seeding items...')

  const items = [
    // Brewing Tools
    {
      name: 'Crystal Stirring Rod',
      description: 'Channel steady mana while stirring volatile mixtures.'
    },
    {
      name: 'Obsidian Mortar & Pestle',
      description: 'Heat-resistant grinding tools for processing volatile ingredients.'
    },
    {
      name: 'Silver Measuring Spoons',
      description: 'Precise measurement tools that resist magical contamination.'
    },
    {
      name: 'Enchanted Thermometer',
      description: 'Measures temperature in both physical and magical spectrums.'
    },

    // Storage
    {
      name: 'Moonlit Vial',
      description: 'A vial etched with lunar runes that preserves potion potency.'
    },
    {
      name: 'Runed Satchel',
      description: 'Bag infused with dimensional magic for ingredient storage.'
    },
    {
      name: 'Frost-Sealed Container',
      description: 'Keeps temperature-sensitive ingredients perfectly chilled.'
    },
    {
      name: 'Void Pocket',
      description: 'Small pouch that opens to an extra-dimensional space.'
    },

    // Reference Materials
    {
      name: 'Alchemist\'s Handbook',
      description: 'Comprehensive guide to basic potion brewing techniques.'
    },
    {
      name: 'Rare Ingredient Compendium',
      description: 'Detailed catalog of exotic ingredients and their properties.'
    },
    {
      name: 'Crystal Cauldron Manual',
      description: 'Instructions for utilizing essence infusions in brewing.'
    },

    // Protective Gear
    {
      name: 'Dragonhide Gloves',
      description: 'Heat and acid resistant gloves for handling dangerous materials.'
    },
    {
      name: 'Alchemist\'s Apron',
      description: 'Enchanted apron that repels splashes and spills.'
    },
    {
      name: 'Safety Goggles',
      description: 'Protects eyes from fumes and bright magical reactions.'
    },

    // Special Items
    {
      name: 'Philosopher\'s Stone Fragment',
      description: 'A tiny piece of the legendary stone, greatly enhances transmutation.'
    },
    {
      name: 'Eternal Flame Lantern',
      description: 'Provides consistent heat source that never extinguishes.'
    },
    {
      name: 'Alira\'s Token',
      description: 'Guild badge granting access to restricted ingredient markets.'
    }
  ]

  await prisma.item.createMany({ data: items })
  console.log(`Created ${items.length} items.`)
}

async function seedItemInventory() {
  console.log('Seeding item inventory...')

  const items = await prisma.item.findMany()
  const itemMap = new Map(items.map((item) => [item.name, item.id]))

  const inventorySeeds = [
    { name: 'Crystal Stirring Rod', quantity: 2 },
    { name: 'Obsidian Mortar & Pestle', quantity: 1 },
    { name: 'Silver Measuring Spoons', quantity: 3 },
    { name: 'Enchanted Thermometer', quantity: 1 },
    { name: 'Moonlit Vial', quantity: 12 },
    { name: 'Runed Satchel', quantity: 2 },
    { name: 'Frost-Sealed Container', quantity: 4 },
    { name: 'Void Pocket', quantity: 1 },
    { name: 'Alchemist\'s Handbook', quantity: 1 },
    { name: 'Rare Ingredient Compendium', quantity: 1 },
    { name: 'Crystal Cauldron Manual', quantity: 1 },
    { name: 'Dragonhide Gloves', quantity: 2 },
    { name: 'Alchemist\'s Apron', quantity: 1 },
    { name: 'Safety Goggles', quantity: 2 },
    { name: 'Eternal Flame Lantern', quantity: 1 },
    { name: 'Alira\'s Token', quantity: 1 }
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

  console.log(`Created ${inventorySeeds.length} item inventory entries.`)
}

async function seedPotionsAndInventory() {
  console.log('Seeding potions and inventory...')

  const recipes = await prisma.recipe.findMany()
  const recipeMap = new Map(recipes.map((recipe) => [recipe.name, recipe.id]))

  const potionSeeds = [
    // Healing potions - well stocked
    { recipe: 'Radiant Renewal', quality: 'HQ' as const, quantity: 3 },
    { recipe: 'Radiant Renewal', quality: 'NORMAL' as const, quantity: 5 },
    { recipe: 'Mender\'s Salve', quality: 'NORMAL' as const, quantity: 8 },
    { recipe: 'Mender\'s Salve', quality: 'HQ' as const, quantity: 2 },
    { recipe: 'Phoenix Tears', quality: 'HQ' as const, quantity: 1 },

    // Utility potions
    { recipe: 'Chilling Clarity', quality: 'NORMAL' as const, quantity: 4 },
    { recipe: 'Fever Break', quality: 'NORMAL' as const, quantity: 6 },
    { recipe: 'Night Vision', quality: 'NORMAL' as const, quantity: 3 },
    { recipe: 'Endurance Elixir', quality: 'NORMAL' as const, quantity: 4 },
    { recipe: 'Endurance Elixir', quality: 'LQ' as const, quantity: 2 },

    // Combat potions
    { recipe: 'Inferno Tonic', quality: 'NORMAL' as const, quantity: 2 },
    { recipe: 'Stone Skin', quality: 'NORMAL' as const, quantity: 3 },
    { recipe: 'Stone Skin', quality: 'HQ' as const, quantity: 1 },

    // Stealth potions
    { recipe: 'Phantom Veil', quality: 'NORMAL' as const, quantity: 2 },
    { recipe: 'Chameleon Draught', quality: 'NORMAL' as const, quantity: 3 },

    // Magic potions
    { recipe: 'Arcane Surge', quality: 'HQ' as const, quantity: 1 },
    { recipe: 'Arcane Surge', quality: 'NORMAL' as const, quantity: 2 },

    // Antidote
    { recipe: 'Universal Antidote', quality: 'NORMAL' as const, quantity: 4 },
    { recipe: 'Universal Antidote', quality: 'HQ' as const, quantity: 1 }
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

  console.log(`Created ${potionSeeds.length} potions with inventory.`)
}

async function seedPeople() {
  console.log('Seeding people...')

  const peopleSeeds = [
    // Guild Members
    {
      name: 'Alira Voss',
      description: 'Guild master of Minerva, famed for her encyclopedic potion knowledge. She has been brewing for over 40 years and has forgotten more about alchemy than most will ever learn.',
      relationship: 'Mentor',
      notableEvents: 'Guided the player through their first cauldron mishap. Shared her personal recipe for Phoenix Tears.',
      url: 'https://example.com/people/alira',
      isFavorited: true
    },
    {
      name: 'Marcus Thorne',
      description: 'Senior alchemist specializing in combat potions. Former soldier who found peace in brewing.',
      relationship: 'Colleague',
      notableEvents: 'Taught the Inferno Tonic recipe. Saved the workshop from a fire elemental.',
      url: null,
      isFavorited: false
    },
    {
      name: 'Lily Fernwood',
      description: 'Young apprentice with exceptional talent for healing potions. Optimistic and eager to learn.',
      relationship: 'Student',
      notableEvents: 'First successful brewing of Radiant Renewal under supervision.',
      url: null,
      isFavorited: false
    },

    // Traders
    {
      name: 'Tarin Calder',
      description: 'Reclusive herbalist who trades rare swamp flora. Knows secret paths through the Mistmarsh.',
      relationship: 'Trader',
      notableEvents: 'Brokered Frostvine Sap after a midnight rescue. Offered exclusive access to Void Spores.',
      url: null,
      isFavorited: true
    },
    {
      name: 'Zara Blackwood',
      description: 'Traveling merchant dealing in exotic ingredients from the eastern kingdoms.',
      relationship: 'Trader',
      notableEvents: 'Supplied rare Phoenix Feather Ash. Offers discount for bulk orders.',
      url: 'https://example.com/merchants/zara',
      isFavorited: false
    },
    {
      name: 'Old Gregor',
      description: 'Retired miner who now trades in volcanic minerals and rare salts.',
      relationship: 'Trader',
      notableEvents: 'Only reliable source of Volcanic Salt in the region.',
      url: null,
      isFavorited: false
    },

    // Contacts
    {
      name: 'Nyra Vale',
      description: 'Arcane courier who smuggles spell scrolls and magical components between city-states.',
      relationship: 'Friend',
      notableEvents: 'Delivered Moonstone Dust just before the eclipse. Warned about ingredient thieves.',
      url: null,
      isFavorited: true
    },
    {
      name: 'Captain Rena Stormwind',
      description: 'Ship captain who sails dangerous waters to retrieve deep-sea ingredients.',
      relationship: 'Contact',
      notableEvents: 'Brought Starlight Dew from the Moonlit Isles. Available for special expeditions.',
      url: null,
      isFavorited: false
    },
    {
      name: 'Brother Aldric',
      description: 'Monk from the Monastery of Eternal Light, keeper of ancient healing recipes.',
      relationship: 'Ally',
      notableEvents: 'Shared the Universal Antidote formula. Requested help with plague in the valley.',
      url: null,
      isFavorited: false
    },

    // Rivals/Antagonists
    {
      name: 'Viktor Crane',
      description: 'Rival alchemist known for cutting corners and stealing formulas. Runs a competing shop.',
      relationship: 'Rival',
      notableEvents: 'Attempted to steal the Arcane Surge recipe. Spreading rumors about our shop.',
      url: null,
      isFavorited: false
    },
    {
      name: 'The Hooded Buyer',
      description: 'Mysterious figure who purchases dangerous potions. Identity unknown.',
      relationship: 'Suspicious',
      notableEvents: 'Offered triple price for Assassin\'s Kiss. Left cryptic warning about "the coming storm."',
      url: null,
      isFavorited: false
    },

    // Customers
    {
      name: 'Lady Evelyn Hart',
      description: 'Noblewoman who regularly orders beauty and health potions for her household.',
      relationship: 'Regular Customer',
      notableEvents: 'Orders weekly supply of Fever Break. Generous tipper.',
      url: null,
      isFavorited: false
    },
    {
      name: 'Sir Aldric the Bold',
      description: 'Knight-errant who relies on combat potions for his monster-hunting expeditions.',
      relationship: 'Regular Customer',
      notableEvents: 'Bulk orders before each quest. Brought back Dragon Pepper as payment once.',
      url: null,
      isFavorited: true
    }
  ]

  await prisma.person.createMany({ data: peopleSeeds })
  console.log(`Created ${peopleSeeds.length} people.`)
}

async function seedSpells() {
  console.log('Seeding spells...')

  const spells = [
    // Learned spells
    { name: 'Mana Sight', currentStars: 3, neededStars: 3, isLearned: true },
    { name: 'Spectral Anchor', currentStars: 2, neededStars: 2, isLearned: true },
    { name: 'Flame Ward', currentStars: 2, neededStars: 2, isLearned: true },
    { name: 'Quick Freeze', currentStars: 1, neededStars: 1, isLearned: true },

    // In progress
    { name: 'Aegis Bloom', currentStars: 2, neededStars: 3, isLearned: false },
    { name: 'Temporal Stir', currentStars: 1, neededStars: 3, isLearned: false },
    { name: 'Essence Detection', currentStars: 3, neededStars: 4, isLearned: false },

    // Not started
    { name: 'Solar Lance', currentStars: 0, neededStars: 4, isLearned: false },
    { name: 'Void Grasp', currentStars: 0, neededStars: 5, isLearned: false },
    { name: 'Elemental Fusion', currentStars: 0, neededStars: 5, isLearned: false },
    { name: 'Alchemical Transmutation', currentStars: 0, neededStars: 6, isLearned: false },
    { name: 'Phoenix Rebirth', currentStars: 0, neededStars: 7, isLearned: false }
  ]

  await prisma.spell.createMany({ data: spells })
  console.log(`Created ${spells.length} spells.`)
}

async function seedSkills() {
  console.log('Seeding skills...')

  const skills = [
    // Brewing Skills
    { name: 'Crystal Infusion' },
    { name: 'Rapid Decanting' },
    { name: 'Aromatic Binding' },
    { name: 'Temperature Control' },
    { name: 'Essence Extraction' },
    { name: 'Potion Stabilization' },

    // Ingredient Skills
    { name: 'Herb Identification' },
    { name: 'Mineral Processing' },
    { name: 'Venom Handling' },
    { name: 'Magical Preservation' },

    // Business Skills
    { name: 'Ingredient Negotiation' },
    { name: 'Quality Assessment' },
    { name: 'Recipe Documentation' },

    // Advanced Skills
    { name: 'Cauldron Mastery' },
    { name: 'Transmutation Basics' },
    { name: 'Curse Resistance' }
  ]

  await prisma.skill.createMany({ data: skills })
  console.log(`Created ${skills.length} skills.`)
}

async function seedCurrencies() {
  console.log('Seeding currencies...')

  const currencies = [
    { name: 'Gold', value: 2847 },
    { name: 'Silver', value: 156 },
    { name: 'Copper', value: 42 },
    { name: 'Guild Scrip', value: 320 },
    { name: 'Sun Shards', value: 18 },
    { name: 'Moon Tokens', value: 7 },
    { name: 'Trade Credits', value: 500 }
  ]

  await prisma.currency.createMany({ data: currencies })
  console.log(`Created ${currencies.length} currencies.`)
}

async function seedTaskDefinitions() {
  console.log('Seeding task definitions...')

  const taskDefinitions = [
    {
      type: 'GATHER_INGREDIENT' as const,
      name: 'Gather Ingredients',
      timeUnits: 1,
      color: '#22c55e',
      description: 'Venture out to collect herbs, minerals, and other potion components.',
      restrictions: { requiresLocation: true }
    },
    {
      type: 'BREWING' as const,
      name: 'Brewing Session',
      timeUnits: 2,
      color: '#8b5cf6',
      description: 'Spend time at the cauldron creating potions from gathered ingredients.',
      restrictions: { requiresIngredients: true }
    },
    {
      type: 'SECURE_INGREDIENTS' as const,
      name: 'Secure Ingredients',
      timeUnits: 1,
      color: '#f59e0b',
      description: 'Properly store and preserve delicate or dangerous ingredients.',
      restrictions: undefined
    },
    {
      type: 'RESEARCH_RECIPES' as const,
      name: 'Recipe Research',
      timeUnits: 2,
      color: '#3b82f6',
      description: 'Study texts and experiment to discover new potion recipes.',
      restrictions: { requiresReference: true }
    },
    {
      type: 'RESEARCH_SPELL' as const,
      name: 'Spell Study',
      timeUnits: 2,
      color: '#ec4899',
      description: 'Practice and develop magical abilities to enhance brewing.',
      restrictions: { requiresSpellbook: true }
    },
    {
      type: 'FREE_TIME' as const,
      name: 'Free Time',
      timeUnits: 1,
      color: '#6b7280',
      description: 'Rest, socialize, or pursue personal interests.',
      restrictions: undefined
    }
  ]

  await prisma.taskDefinition.createMany({ data: taskDefinitions })
  console.log(`Created ${taskDefinitions.length} task definitions.`)
}

async function seedWeekSchedule() {
  console.log('Seeding week schedule...')

  // Get current week's Monday
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  monday.setHours(0, 0, 0, 0)

  const weekSchedule = await prisma.weekSchedule.create({
    data: {
      weekStartDate: monday,
      totalScheduledUnits: 15,
      freeTimeUsed: true
    }
  })

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  // Create day schedules
  const daySchedules: DaySchedule[] = []
  for (let i = 0; i < 7; i++) {
    const daySchedule = await prisma.daySchedule.create({
      data: {
        weekScheduleId: weekSchedule.id,
        day: i,
        dayName: dayNames[i],
        totalUnits: i < 5 ? 3 : 2 // Weekdays have more units
      }
    })
    daySchedules.push(daySchedule)
  }

  // Sample tasks for the week
  const tasks = [
    // Monday
    { dayIndex: 0, timeSlot: 'MORNING' as const, type: 'GATHER_INGREDIENT' as const, timeUnits: 1, notes: 'Collect Frostvine Sap from the northern caves', details: { location: 'Northern Caves', targetIngredient: 'Frostvine Sap' } },
    { dayIndex: 0, timeSlot: 'AFTERNOON' as const, type: 'BREWING' as const, timeUnits: 2, notes: 'Brew healing potions for Lady Hart\'s order', details: { recipe: 'Mender\'s Salve', quantity: 4 } },

    // Tuesday
    { dayIndex: 1, timeSlot: 'MORNING' as const, type: 'RESEARCH_RECIPES' as const, timeUnits: 2, notes: 'Study Void Touch recipe variations', details: { recipe: 'Void Touch' } },
    { dayIndex: 1, timeSlot: 'EVENING' as const, type: 'FREE_TIME' as const, timeUnits: 1, notes: 'Meet Nyra at the tavern', details: undefined },

    // Wednesday
    { dayIndex: 2, timeSlot: 'MORNING' as const, type: 'GATHER_INGREDIENT' as const, timeUnits: 1, notes: 'Harvest Shadow Moss from the old ruins', details: { location: 'Ancient Ruins', targetIngredient: 'Shadow Moss' } },
    { dayIndex: 2, timeSlot: 'AFTERNOON' as const, type: 'SECURE_INGREDIENTS' as const, timeUnits: 1, notes: 'Properly store the Deathcap Powder shipment', details: { ingredient: 'Deathcap Powder' } },
    { dayIndex: 2, timeSlot: 'EVENING' as const, type: 'BREWING' as const, timeUnits: 2, notes: 'Prepare combat potions for Sir Aldric', details: { recipe: 'Stone Skin', quantity: 2 } },

    // Thursday
    { dayIndex: 3, timeSlot: 'MORNING' as const, type: 'RESEARCH_SPELL' as const, timeUnits: 2, notes: 'Practice Aegis Bloom incantation', details: { spell: 'Aegis Bloom', targetStars: 3 } },
    { dayIndex: 3, timeSlot: 'AFTERNOON' as const, type: 'BREWING' as const, timeUnits: 2, notes: 'Emergency antidote production', details: { recipe: 'Universal Antidote', quantity: 3 } },

    // Friday
    { dayIndex: 4, timeSlot: 'MORNING' as const, type: 'GATHER_INGREDIENT' as const, timeUnits: 1, notes: 'Meet Tarin for ingredient exchange', details: { location: 'Mistmarsh Edge', contact: 'Tarin Calder' } },
    { dayIndex: 4, timeSlot: 'AFTERNOON' as const, type: 'BREWING' as const, timeUnits: 2, notes: 'Weekly potion restocking', details: { recipes: ['Radiant Renewal', 'Fever Break'] } },

    // Saturday
    { dayIndex: 5, timeSlot: 'MORNING' as const, type: 'FREE_TIME' as const, timeUnits: 1, notes: 'Guild social gathering', details: undefined },
    { dayIndex: 5, timeSlot: 'AFTERNOON' as const, type: 'RESEARCH_RECIPES' as const, timeUnits: 2, notes: 'Experiment with Crystal Cauldron essences', details: { focus: 'Essence combinations' } },

    // Sunday
    { dayIndex: 6, timeSlot: 'MORNING' as const, type: 'FREE_TIME' as const, timeUnits: 1, notes: 'Rest day', details: undefined },
    { dayIndex: 6, timeSlot: 'AFTERNOON' as const, type: 'SECURE_INGREDIENTS' as const, timeUnits: 1, notes: 'Weekly inventory check and organization', details: undefined }
  ]

  for (const task of tasks) {
    await prisma.scheduledTask.create({
      data: {
        dayScheduleId: daySchedules[task.dayIndex].id,
        type: task.type,
        timeUnits: task.timeUnits,
        day: task.dayIndex,
        timeSlot: task.timeSlot,
        notes: task.notes,
        details: task.details
      }
    })
  }

  console.log(`Created week schedule with ${tasks.length} tasks.`)
}

async function main() {
  console.log('Starting comprehensive database seed...\n')

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
  await seedTaskDefinitions()
  await seedWeekSchedule()

  console.log('\nDatabase seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
