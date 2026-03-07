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
  <div>
    <Card
      v-for="recipe in recipes"
      :key="recipe.id"
    >
      <div>
        <div>
          <div :title="getCraftabilityText(recipe.id)" />
          <h3>{{ recipe.name }}</h3>
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            :disabled="!craftability[recipe.id]"
            @click="emit('craft', recipe)"
          >
            <FlaskConical />
            Craft
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="emit('addPotion', recipe)"
          >
            Add
          </Button>
          <Button
            variant="ghost"
            size="icon"
            @click="emit('edit', recipe)"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            :disabled="!deletability[recipe.id]?.canDelete"
            :title="deletability[recipe.id]?.reason || undefined"
            @click="emit('delete', recipe.id)"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div v-if="recipe.description">
        <p>{{ recipe.description }}</p>
      </div>

      <div>
        <div>Required Ingredients</div>
        <div>
          <Badge
            v-for="ing in recipe.ingredients"
            :key="ing.ingredientId"
            :variant="getIngredientStatus(ing.ingredientId, ing.quantity) === 'sufficient' ? 'secondary' : 'destructive'"
          >
            <span>{{ ing.ingredient.name }}</span>
            <span>×{{ ing.quantity }}</span>
          </Badge>
        </div>
      </div>

      <div
        v-if="recipe.fireEssence || recipe.airEssence || recipe.waterEssence || recipe.lightningEssence || recipe.earthEssence || recipe.lifeEssence || recipe.deathEssence"
      >
        <div>Crystal Cauldron Effects</div>
        <div>
          <div v-if="recipe.fireEssence">
            <span>Fire:</span>
            <span>{{ recipe.fireEssence }}</span>
          </div>
          <div v-if="recipe.airEssence">
            <span>Air:</span>
            <span>{{ recipe.airEssence }}</span>
          </div>
          <div v-if="recipe.waterEssence">
            <span>Water:</span>
            <span>{{ recipe.waterEssence }}</span>
          </div>
          <div v-if="recipe.lightningEssence">
            <span>Lightning:</span>
            <span>{{ recipe.lightningEssence }}</span>
          </div>
          <div v-if="recipe.earthEssence">
            <span>Earth:</span>
            <span>{{ recipe.earthEssence }}</span>
          </div>
          <div v-if="recipe.lifeEssence">
            <span>Life:</span>
            <span>{{ recipe.lifeEssence }}</span>
          </div>
          <div v-if="recipe.deathEssence">
            <span>Death:</span>
            <span>{{ recipe.deathEssence }}</span>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
