<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Recipe } from '@/types/store/recipe'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const POTION_QUALITIES = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'LQ', label: 'LQ' },
  { value: 'HQ', label: 'HQ' },
]
import { Card } from '@/components/ui/card'

interface CraftabilityIngredient {
  ingredientId: number
  ingredientName: string
  requiredQuantity: number
  availableQuantity: number
  isCraftable: boolean
  availableOptions: Array<{
    inventoryItemId: number
    quality: string
    totalAvailable: number
  }>
}

interface CauldronVariantCraftability {
  essenceType: string
  variantName: string
  essenceIngredientId: number
  essenceIngredientName: string
  essenceAvailable: number
  isAvailable: boolean
}

interface Craftability {
  isCraftable: boolean
  ingredients: CraftabilityIngredient[]
  cauldronVariants: CauldronVariantCraftability[]
}

interface Props {
  open: boolean
  recipe: Recipe | null
  craftability: Craftability | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  craft: [data: { recipeId: number; quality: string; essenceType?: string; ingredientSelections: Array<{ ingredientId: number; inventoryItemId: number; quantity: number }> }]
}>()

const selectedQuality = ref('NORMAL')
const selectedEssenceType = ref<string | null>(null)
const ingredientSelections = ref<Record<number, number>>({})


const QUALITY_PRIORITY = ['NORMAL', 'LQ', 'HQ']

function qualityLabel(q: string): string {
  if (q === 'NORMAL') return 'Normal'
  if (q === 'HQ') return 'HQ'
  if (q === 'LQ') return 'LQ'
  return q
}

function pickDefault(options: CraftabilityIngredient['availableOptions']): number | null {
  for (const q of QUALITY_PRIORITY) {
    const match = options.find(o => o.quality === q)
    if (match) return match.inventoryItemId
  }
  return options[0]?.inventoryItemId ?? null
}

function autoSelectIngredients() {
  if (!props.craftability) return
  const selections: Record<number, number> = {}
  for (const ing of props.craftability.ingredients) {
    if (ing.isCraftable) {
      const id = pickDefault(ing.availableOptions)
      if (id !== null) selections[ing.ingredientId] = id
    }
  }
  ingredientSelections.value = selections
}

watch(() => props.open, (open) => {
  if (open) {
    selectedQuality.value = 'NORMAL'
    selectedEssenceType.value = null
    autoSelectIngredients()
  }
})

watch(() => props.craftability, () => {
  if (props.open) autoSelectIngredients()
})

const canCraft = computed(() => {
  if (!props.craftability?.isCraftable) return false
  return props.craftability.ingredients.every(ing =>
    ing.isCraftable && ingredientSelections.value[ing.ingredientId]
  )
})

function handleCraft() {
  if (!props.recipe || !props.craftability) return

  emit('craft', {
    recipeId: props.recipe.id,
    quality: selectedQuality.value,
    ...(selectedEssenceType.value ? { essenceType: selectedEssenceType.value } : {}),
    ingredientSelections: props.craftability.ingredients.map(ing => ({
      ingredientId: ing.ingredientId,
      inventoryItemId: ingredientSelections.value[ing.ingredientId]!,
      quantity: ing.requiredQuantity
    }))
  })

  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Craft {{ recipe?.name }}</DialogTitle>
        </DialogHeader>

        <div v-if="craftability" class="craft-body">
<div class="field">
            <label class="field-label">Potion Quality</label>
            <div class="quality-toggle">
              <button
                v-for="q in POTION_QUALITIES"
                :key="q.value"
                type="button"
                class="quality-btn"
                :class="selectedQuality === q.value ? 'quality-btn-active' : ''"
                @click="selectedQuality = q.value"
              >
                {{ q.label }}
              </button>
            </div>
          </div>

          <div v-if="craftability.cauldronVariants && craftability.cauldronVariants.length > 0" class="field">
            <label class="field-label">Crystal Cauldron <span class="field-optional">(optional)</span></label>
            <div class="variant-options">
              <button
                class="variant-btn"
                :class="selectedEssenceType === null ? 'variant-btn-active' : ''"
                type="button"
                @click="selectedEssenceType = null"
              >
                Standard (no cauldron)
              </button>
              <button
                v-for="variant in craftability.cauldronVariants"
                :key="variant.essenceType"
                class="variant-btn"
                :class="[
                  selectedEssenceType === variant.essenceType ? 'variant-btn-active' : '',
                  !variant.isAvailable ? 'variant-btn-disabled' : ''
                ]"
                type="button"
                :disabled="!variant.isAvailable"
                @click="selectedEssenceType = variant.isAvailable ? variant.essenceType : selectedEssenceType"
              >
                <span class="variant-btn-name">{{ variant.variantName }}</span>
                <span class="variant-btn-meta">{{ variant.essenceType.charAt(0) + variant.essenceType.slice(1).toLowerCase() }} · {{ variant.essenceIngredientName }}</span>
                <Badge :variant="variant.isAvailable ? 'secondary' : 'destructive'" class="variant-badge">
                  {{ variant.essenceAvailable }} avail.
                </Badge>
              </button>
            </div>
          </div>

          <div class="field">
            <label class="field-label">Select Ingredients</label>
            <div class="card-list">
              <Card
                v-for="ing in craftability.ingredients"
                :key="ing.ingredientId"
              >
                <div class="ing-row">
                  <div class="ing-header">
                    <span class="ing-name">{{ ing.ingredientName }}</span>
                    <Badge :variant="ing.isCraftable ? 'secondary' : 'destructive'">
                      {{ ing.availableQuantity }} / {{ ing.requiredQuantity }}
                    </Badge>
                  </div>

                  <div v-if="ing.isCraftable" class="quality-toggle">
                    <button
                      v-for="opt in ing.availableOptions"
                      :key="opt.inventoryItemId"
                      type="button"
                      class="quality-btn"
                      :class="ingredientSelections[ing.ingredientId] === opt.inventoryItemId ? 'quality-btn-active' : ''"
                      @click="ingredientSelections[ing.ingredientId] = opt.inventoryItemId"
                    >
                      {{ qualityLabel(opt.quality) }}
                      <span class="quality-count">{{ opt.totalAvailable }}</span>
                    </button>
                  </div>
                  <div v-else class="shortage">
                    Need {{ ing.requiredQuantity - ing.availableQuantity }} more
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div v-else class="craft-body">
          <p class="empty-state">Loading recipe information...</p>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="emit('update:open', false)">
            Cancel
          </Button>
          <Button :disabled="!canCraft" @click="handleCraft">
            Craft Potion
          </Button>
        </DialogFooter>
      </DialogContent>
    </template>
  </Dialog>
</template>

<style scoped>
.craft-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1.375rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
  display: block;
}

.ing-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
}

.ing-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.ing-name {
  font-weight: 500;
  font-size: 0.875rem;
}

.shortage {
  font-size: 0.8125rem;
  color: var(--color-destructive);
}

.quality-toggle {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.quality-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8125rem;
  color: var(--color-foreground);
  transition: border-color 0.1s, background-color 0.1s;
}

.quality-btn:hover {
  border-color: var(--color-primary);
}

.quality-btn-active {
  border-color: var(--color-primary);
  background-color: color-mix(in srgb, var(--color-primary) 10%, var(--color-background));
  font-weight: 500;
}

.quality-count {
  font-size: 0.75rem;
  color: var(--color-muted-foreground);
}

.field-optional {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--color-muted-foreground);
}

.variant-options {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.variant-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 0.875rem;
  color: var(--color-foreground);
  transition: border-color 0.15s, background-color 0.15s;
}

.variant-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.variant-btn-active {
  border-color: var(--color-primary);
  background-color: color-mix(in srgb, var(--color-primary) 8%, var(--color-card));
}

.variant-btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.variant-btn-name {
  font-weight: 500;
  flex: 1;
}

.variant-btn-meta {
  font-size: 0.8125rem;
  color: var(--color-muted-foreground);
  flex-shrink: 0;
}

.variant-badge {
  flex-shrink: 0;
}
</style>
