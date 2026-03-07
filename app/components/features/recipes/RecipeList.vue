<script setup lang="ts">
import type { Recipe } from '@/types/store/recipe'
import type { InventoryItem } from '@/types/store/inventory'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, FlaskConical } from 'lucide-vue-next'

interface Props {
  recipes: Recipe[]
  craftability: Record<number, boolean>
  deletability: Record<number, { canDelete: boolean; reason: string | null }>
  inventoryItems: InventoryItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  craft: [recipe: Recipe]
  addPotion: [recipe: Recipe]
  edit: [recipe: Recipe]
  delete: [id: number]
}>()

function getCraftabilityClass(recipeId: number): string {
  const isCraftable = props.craftability[recipeId]
  if (isCraftable === undefined) return 'bg-muted-foreground'
  return isCraftable ? 'bg-green-500' : 'bg-destructive'
}

function getCraftabilityText(recipeId: number): string {
  const isCraftable = props.craftability[recipeId]
  if (isCraftable === undefined) return 'Unknown'
  return isCraftable ? 'Craftable' : 'Missing ingredients'
}

function getAvailableQuantity(ingredientId: number): number {
  return props.inventoryItems
    .filter(item => item.ingredientId === ingredientId)
    .reduce((total, item) => total + item.quantity, 0)
}

function getIngredientStatus(ingredientId: number, required: number): 'sufficient' | 'insufficient' {
  const available = getAvailableQuantity(ingredientId)
  return available >= required ? 'sufficient' : 'insufficient'
}
</script>

<template>
  <div class="space-y-4">
    <Card
      v-for="recipe in recipes"
      :key="recipe.id"
      class="p-4"
    >
      <!-- Header Row: Name, Status, and Controls -->
      <div class="flex items-start justify-between gap-4 mb-3">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div
            class="h-3 w-3 rounded-full flex-shrink-0"
            :class="getCraftabilityClass(recipe.id)"
            :title="getCraftabilityText(recipe.id)"
          />
          <h3 class="text-lg font-semibold">{{ recipe.name }}</h3>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            :disabled="!craftability[recipe.id]"
            @click="emit('craft', recipe)"
          >
            <FlaskConical class="h-4 w-4 mr-1" />
            Craft
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="text-green-500 hover:text-green-400"
            @click="emit('addPotion', recipe)"
          >
            Add
          </Button>
          <Button
            variant="ghost"
            size="icon"
            @click="emit('edit', recipe)"
          >
            <Pencil class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            :disabled="!deletability[recipe.id]?.canDelete"
            :title="deletability[recipe.id]?.reason || undefined"
            @click="emit('delete', recipe.id)"
          >
            <Trash2 class="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <!-- Description Row -->
      <div v-if="recipe.description" class="mb-3">
        <p class="text-sm text-muted-foreground leading-relaxed">
          {{ recipe.description }}
        </p>
      </div>

      <!-- Ingredients Row -->
      <div class="mb-3">
        <div class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Required Ingredients</div>
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="ing in recipe.ingredients"
            :key="ing.ingredientId"
            :variant="getIngredientStatus(ing.ingredientId, ing.quantity) === 'sufficient' ? 'secondary' : 'destructive'"
            class="text-sm py-1 px-3"
          >
            <span class="font-medium">{{ ing.ingredient.name }}</span>
            <span class="mx-1.5 opacity-60">×{{ ing.quantity }}</span>
          </Badge>
        </div>
      </div>

      <!-- Crystal Cauldron Essences -->
      <div
        v-if="recipe.fireEssence || recipe.airEssence || recipe.waterEssence || recipe.lightningEssence || recipe.earthEssence || recipe.lifeEssence || recipe.deathEssence"
        class="pt-3 border-t border-border"
      >
        <div class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Crystal Cauldron Effects</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          <div v-if="recipe.fireEssence" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-orange-500" />
            <span class="text-muted-foreground">Fire:</span>
            <span>{{ recipe.fireEssence }}</span>
          </div>
          <div v-if="recipe.airEssence" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-sky-300" />
            <span class="text-muted-foreground">Air:</span>
            <span>{{ recipe.airEssence }}</span>
          </div>
          <div v-if="recipe.waterEssence" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-blue-500" />
            <span class="text-muted-foreground">Water:</span>
            <span>{{ recipe.waterEssence }}</span>
          </div>
          <div v-if="recipe.lightningEssence" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-yellow-400" />
            <span class="text-muted-foreground">Lightning:</span>
            <span>{{ recipe.lightningEssence }}</span>
          </div>
          <div v-if="recipe.earthEssence" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-700" />
            <span class="text-muted-foreground">Earth:</span>
            <span>{{ recipe.earthEssence }}</span>
          </div>
          <div v-if="recipe.lifeEssence" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-green-500" />
            <span class="text-muted-foreground">Life:</span>
            <span>{{ recipe.lifeEssence }}</span>
          </div>
          <div v-if="recipe.deathEssence" class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-purple-700" />
            <span class="text-muted-foreground">Death:</span>
            <span>{{ recipe.deathEssence }}</span>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
