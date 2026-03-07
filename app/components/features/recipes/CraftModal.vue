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
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Check, X } from 'lucide-vue-next'

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

interface Craftability {
  isCraftable: boolean
  ingredients: CraftabilityIngredient[]
}

interface Props {
  open: boolean
  recipe: Recipe | null
  craftability: Craftability | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  craft: [data: { recipeId: number; quality: string; ingredientSelections: Array<{ ingredientId: number; inventoryItemId: number; quantity: number }> }]
}>()

const selectedQuality = ref('NORMAL')
const ingredientSelections = ref<Record<number, number>>({})

const qualityOptions = [
  { value: 'NORMAL', label: 'Normal Quality' },
  { value: 'HQ', label: 'High Quality' },
  { value: 'LQ', label: 'Low Quality' }
]

watch(() => props.open, (open) => {
  if (open) {
    selectedQuality.value = 'NORMAL'
    ingredientSelections.value = {}
  }
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

        <div v-if="craftability">
          <div>
            <component :is="craftability.isCraftable ? Check : X" />
            <span>{{ craftability.isCraftable ? 'Recipe is craftable!' : 'Insufficient ingredients' }}</span>
          </div>

          <div>
            <label>Potion Quality</label>
            <Select
              v-model="selectedQuality"
              :options="qualityOptions"
            />
          </div>

          <div>
            <label>Select Ingredients</label>
            <div>
              <Card
                v-for="ing in craftability.ingredients"
                :key="ing.ingredientId"
              >
                <div>
                  <div>
                    <span>{{ ing.ingredientName }}</span>
                    <Badge :variant="ing.isCraftable ? 'secondary' : 'destructive'">
                      {{ ing.availableQuantity }} / {{ ing.requiredQuantity }}
                    </Badge>
                  </div>

                  <Select
                    v-if="ing.isCraftable"
                    :model-value="String(ingredientSelections[ing.ingredientId] || '')"
                    :options="ing.availableOptions.map(opt => ({
                      value: String(opt.inventoryItemId),
                      label: `${opt.quality} (${opt.totalAvailable} available)`
                    }))"
                    placeholder="Select quality..."
                    @update:model-value="(val: string) => ingredientSelections[ing.ingredientId] = Number(val)"
                  />
                  <div v-else>
                    Need {{ ing.requiredQuantity - ing.availableQuantity }} more
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div v-else>
          Loading recipe information...
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
