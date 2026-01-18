<script setup lang="ts">
import type { Recipe } from '@/types/store/recipe'
import type { InventoryItem } from '@/types/store/inventory'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@/components/ui/table'
import { Pencil, Trash2, FlaskConical, Plus } from 'lucide-vue-next'

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

function getAvailableQuantity(ingredientId: number): number {
  return props.inventoryItems
    .filter(item => item.ingredientId === ingredientId)
    .reduce((total, item) => total + item.quantity, 0)
}
</script>

<template>
  <Table>
    <TableBody>
      <TableRow v-for="recipe in recipes" :key="recipe.id">
        <TableCell class="w-[40px]">
          <div
            class="h-3 w-3 rounded-full"
            :class="getCraftabilityClass(recipe.id)"
            :title="craftability[recipe.id] ? 'Craftable' : 'Not craftable'"
          />
        </TableCell>
        <TableCell>
          <div class="flex flex-col gap-1">
            <span class="font-medium">{{ recipe.name }}</span>
            <span v-if="recipe.description" class="text-xs text-muted-foreground truncate max-w-[200px]">
              {{ recipe.description }}
            </span>
          </div>
        </TableCell>
        <TableCell class="max-w-[300px]">
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="ing in recipe.ingredients"
              :key="ing.ingredientId"
              variant="secondary"
              class="text-xs"
              :title="`${ing.ingredient.name} x${ing.quantity} - Available: ${getAvailableQuantity(ing.ingredientId)}`"
            >
              {{ ing.ingredient.name }} x{{ ing.quantity }}
              <span class="ml-1 text-green-400">({{ getAvailableQuantity(ing.ingredientId) }})</span>
            </Badge>
          </div>
        </TableCell>
        <TableCell class="w-[200px] text-right">
          <div class="flex justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              @click="emit('craft', recipe)"
            >
              <FlaskConical class="h-3 w-3 mr-1" />
              Craft
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="text-green-500"
              @click="emit('addPotion', recipe)"
            >
              <Plus class="h-3 w-3 mr-1" />
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
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
