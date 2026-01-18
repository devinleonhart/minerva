<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRecipeStore } from '@/store/recipe'
import { useIngredientStore } from '@/store/ingredient'
import { usePotionStore } from '@/store/potion'
import { useInventoryStore } from '@/store/inventory'
import { useToast, useConfirm } from '@/composables'
import type { Recipe, CreateRecipeRequest, UpdateRecipeRequest, RecipeDeletability } from '@/types/store/recipe'
import { PageLayout } from '@/components/layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RecipeList, RecipeForm, CraftModal } from '@/components/features/recipes'
import { Search, Loader2, Plus } from 'lucide-vue-next'

const recipeStore = useRecipeStore()
const ingredientStore = useIngredientStore()
const potionStore = usePotionStore()
const inventoryStore = useInventoryStore()

const { recipes } = storeToRefs(recipeStore)
const { ingredients } = storeToRefs(ingredientStore)
const { craftability } = storeToRefs(potionStore)
const { inventoryItems } = storeToRefs(inventoryStore)

const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const searchQuery = ref('')
const showForm = ref(false)
const showCraftModal = ref(false)
const selectedRecipe = ref<Recipe | null>(null)
const recipesCraftability = ref<Record<number, boolean>>({})
const recipeDeletability = ref<Record<number, RecipeDeletability>>({})
const craftabilityInitialized = ref(false)

const filteredRecipes = computed(() => {
  if (!searchQuery.value) {
    return [...recipes.value].sort((a, b) => a.name.localeCompare(b.name))
  }

  const query = searchQuery.value.toLowerCase()
  return recipes.value
    .filter(recipe =>
      recipe.name.toLowerCase().includes(query) ||
      recipe.description.toLowerCase().includes(query)
    )
    .sort((a, b) => a.name.localeCompare(b.name))
})

onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([
      recipeStore.getRecipes(),
      ingredientStore.getIngredients(),
      inventoryStore.getInventory()
    ])
    await checkAllCraftability()
    craftabilityInitialized.value = true
    await checkAllDeletability()
  } catch {
    toast.error('Failed to load recipes')
  } finally {
    isLoading.value = false
  }
})

watch(
  () => recipes.value,
  async () => {
    if (!craftabilityInitialized.value) return
    await checkAllCraftability()
  },
  { deep: true }
)

async function checkAllCraftability() {
  for (const recipe of recipes.value) {
    try {
      await potionStore.checkRecipeCraftability(recipe.id)
      if (craftability.value) {
        recipesCraftability.value[recipe.id] = craftability.value.isCraftable
      }
    } catch {
      recipesCraftability.value[recipe.id] = false
    }
  }
}

async function checkAllDeletability() {
  for (const recipe of recipes.value) {
    try {
      const result = await recipeStore.checkRecipeDeletability(recipe.id)
      recipeDeletability.value[recipe.id] = result
    } catch {
      recipeDeletability.value[recipe.id] = { canDelete: false, reason: 'Error checking' }
    }
  }
}

function handleAddRecipe() {
  selectedRecipe.value = null
  showForm.value = true
}

function handleEditRecipe(recipe: Recipe) {
  selectedRecipe.value = recipe
  showForm.value = true
}

async function handleCraftRecipe(recipe: Recipe) {
  selectedRecipe.value = recipe
  await potionStore.checkRecipeCraftability(recipe.id)
  showCraftModal.value = true
}

async function handleCreateRecipe(data: CreateRecipeRequest) {
  try {
    await recipeStore.createRecipe(data)
    await checkAllDeletability()
    toast.success('Recipe created successfully')
  } catch {
    toast.error('Failed to create recipe')
  }
}

async function handleUpdateRecipe(id: number, data: UpdateRecipeRequest) {
  try {
    await recipeStore.updateRecipe(id, data)
    await checkAllDeletability()
    toast.success('Recipe updated successfully')
  } catch {
    toast.error('Failed to update recipe')
  }
}

async function handleDeleteRecipe(id: number) {
  const confirmed = await confirm.confirm({
    title: 'Delete Recipe',
    message: 'Are you sure you want to delete this recipe?',
    confirmText: 'Delete',
    variant: 'destructive'
  })

  if (!confirmed) return

  try {
    await recipeStore.deleteRecipe(id)
    toast.success('Recipe deleted successfully')
  } catch {
    toast.error('Failed to delete recipe')
  }
}

async function handleAddPotion(recipe: Recipe) {
  try {
    await potionStore.addPotionDirectly({
      recipeId: recipe.id,
      quality: 'NORMAL'
    })
    toast.success(`Added ${recipe.name} to inventory`)
  } catch {
    toast.error('Failed to add potion')
  }
}

async function handleCraft(data: {
  recipeId: number
  quality: string
  ingredientSelections: Array<{ ingredientId: number; inventoryItemId: number; quantity: number }>
}) {
  try {
    await potionStore.craftPotion(data)
    await ingredientStore.getIngredients()
    await inventoryStore.getInventory()
    await checkAllCraftability()
    toast.success('Potion crafted successfully!')
  } catch {
    toast.error('Failed to craft potion')
  }
}
</script>

<template>
  <PageLayout title="Recipes" description="Hey, my little camping cauldron!">
    <template #actions>
      <div class="flex items-center gap-2">
        <div class="relative w-64">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Search recipes..."
            class="pl-9"
          />
        </div>
        <Button @click="handleAddRecipe">
          <Plus class="mr-2 h-4 w-4" />
          Create Recipe
        </Button>
      </div>
    </template>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="filteredRecipes.length === 0" class="py-12 text-center text-muted-foreground">
      {{ searchQuery ? `No recipes match "${searchQuery}"` : 'No recipes yet. Create your first recipe!' }}
    </div>

    <RecipeList
      v-else
      :recipes="filteredRecipes"
      :craftability="recipesCraftability"
      :deletability="recipeDeletability"
      :inventory-items="inventoryItems"
      @craft="handleCraftRecipe"
      @add-potion="handleAddPotion"
      @edit="handleEditRecipe"
      @delete="handleDeleteRecipe"
    />

    <RecipeForm
      :open="showForm"
      :recipe="selectedRecipe"
      :ingredients="ingredients"
      @update:open="showForm = $event"
      @create="handleCreateRecipe"
      @update="handleUpdateRecipe"
    />

    <CraftModal
      :open="showCraftModal"
      :recipe="selectedRecipe"
      :craftability="craftability"
      @update:open="showCraftModal = $event"
      @craft="handleCraft"
    />
  </PageLayout>
</template>
