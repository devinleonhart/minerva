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
  <div class="card-list">
    <Card
      v-for="recipe in recipes"
      :key="recipe.id"
    >
      <div class="recipe-header">
        <div class="recipe-name-row">
          <div
            class="craftability-dot"
            :class="craftability[recipe.id] ? 'dot-green' : 'dot-red'"
            :title="getCraftabilityText(recipe.id)"
          />
          <h3 class="recipe-name">{{ recipe.name }}</h3>
        </div>

        <div class="actions">
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

      <div v-if="recipe.description" class="recipe-desc">
        <p>{{ recipe.description }}</p>
      </div>

      <div class="recipe-section">
        <div class="section-label">Required Ingredients</div>
        <div class="badge-group">
          <Badge
            v-for="ing in recipe.ingredients"
            :key="ing.ingredientId"
            :variant="getIngredientStatus(ing.ingredientId, ing.quantity) === 'sufficient' ? 'secondary' : 'destructive'"
          >
            {{ ing.ingredient.name }} ×{{ ing.quantity }}
          </Badge>
        </div>
      </div>

      <div
        v-if="recipe.fireEssence || recipe.airEssence || recipe.waterEssence || recipe.lightningEssence || recipe.earthEssence || recipe.lifeEssence || recipe.deathEssence"
        class="recipe-section"
      >
        <div class="section-label">Crystal Cauldron Effects</div>
        <div class="essence-grid">
          <div v-if="recipe.fireEssence" class="essence-item"><span class="essence-name">Fire</span><span>{{ recipe.fireEssence }}</span></div>
          <div v-if="recipe.airEssence" class="essence-item"><span class="essence-name">Air</span><span>{{ recipe.airEssence }}</span></div>
          <div v-if="recipe.waterEssence" class="essence-item"><span class="essence-name">Water</span><span>{{ recipe.waterEssence }}</span></div>
          <div v-if="recipe.lightningEssence" class="essence-item"><span class="essence-name">Lightning</span><span>{{ recipe.lightningEssence }}</span></div>
          <div v-if="recipe.earthEssence" class="essence-item"><span class="essence-name">Earth</span><span>{{ recipe.earthEssence }}</span></div>
          <div v-if="recipe.lifeEssence" class="essence-item"><span class="essence-name">Life</span><span>{{ recipe.lifeEssence }}</span></div>
          <div v-if="recipe.deathEssence" class="essence-item"><span class="essence-name">Death</span><span>{{ recipe.deathEssence }}</span></div>
        </div>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.recipe-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.recipe-name-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}

.craftability-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-green { background-color: #22c55e; }
.dot-red   { background-color: var(--color-destructive); }

.recipe-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recipe-desc {
  padding: 0.75rem 1rem 0;
  color: var(--color-muted-foreground);
  font-size: 0.875rem;
}

.recipe-desc p {
  margin: 0;
}

.recipe-section {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-muted-foreground);
  margin-bottom: 0.5rem;
}

.essence-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.essence-item {
  display: flex;
  gap: 0.25rem;
  font-size: 0.8125rem;
}

.essence-name {
  color: var(--color-muted-foreground);
}
</style>
