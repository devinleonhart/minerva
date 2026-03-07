<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Recipe, CreateRecipeRequest, UpdateRecipeRequest } from '@/types/store/recipe'
import type { Ingredient } from '@/types/store/ingredient'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Plus, Minus, Search } from 'lucide-vue-next'

interface Props {
  open: boolean
  recipe?: Recipe | null
  ingredients: Ingredient[]
}

const props = withDefaults(defineProps<Props>(), {
  recipe: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  create: [data: CreateRecipeRequest]
  update: [id: number, data: UpdateRecipeRequest]
}>()

const name = ref('')
const description = ref('')
const selectedIngredients = ref<Array<{ ingredientId: number; quantity: number }>>([])
const ingredientFilter = ref('')

const isEditing = computed(() => !!props.recipe)
const title = computed(() => isEditing.value ? 'Edit Recipe' : 'Create New Recipe')

const filteredIngredients = computed(() => {
  const filter = ingredientFilter.value.toLowerCase()
  if (!filter) return props.ingredients
  return props.ingredients.filter(ing =>
    ing.name.toLowerCase().includes(filter) ||
    ing.description.toLowerCase().includes(filter)
  )
})

const canSubmit = computed(() =>
  name.value.trim() &&
  description.value.trim() &&
  selectedIngredients.value.length > 0
)

watch(() => props.open, (open) => {
  if (open && props.recipe) {
    name.value = props.recipe.name
    description.value = props.recipe.description
    selectedIngredients.value = props.recipe.ingredients.map(ing => ({
      ingredientId: ing.ingredientId,
      quantity: ing.quantity
    }))
  } else if (open) {
    name.value = ''
    description.value = ''
    selectedIngredients.value = []
  }
  ingredientFilter.value = ''
})

function isSelected(ingredientId: number): boolean {
  return selectedIngredients.value.some(ing => ing.ingredientId === ingredientId)
}

function getQuantity(ingredientId: number): number {
  return selectedIngredients.value.find(ing => ing.ingredientId === ingredientId)?.quantity || 1
}

function toggleIngredient(ingredientId: number) {
  if (isSelected(ingredientId)) {
    selectedIngredients.value = selectedIngredients.value.filter(ing => ing.ingredientId !== ingredientId)
  } else {
    selectedIngredients.value.push({ ingredientId, quantity: 1 })
  }
}

function updateQuantity(ingredientId: number, delta: number) {
  const ing = selectedIngredients.value.find(i => i.ingredientId === ingredientId)
  if (ing) {
    ing.quantity = Math.max(1, ing.quantity + delta)
  }
}

function handleSubmit() {
  if (!canSubmit.value) return

  const data = {
    name: name.value.trim(),
    description: description.value.trim(),
    ingredients: selectedIngredients.value
  }

  if (isEditing.value && props.recipe) {
    emit('update', props.recipe.id, data)
  } else {
    emit('create', data)
  }

  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ title }}</DialogTitle>
        </DialogHeader>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Recipe Name</Label>
            <Input
              id="name"
              v-model="name"
              placeholder="Enter recipe name"
            />
          </div>

          <div class="space-y-2">
            <Label for="description">Description</Label>
            <Textarea
              id="description"
              v-model="description"
              placeholder="Enter recipe description"
              :rows="3"
            />
          </div>

          <div class="space-y-2">
            <Label>Selected Ingredients</Label>
            <div v-if="selectedIngredients.length === 0" class="text-sm text-muted-foreground py-2">
              No ingredients selected. Add some from below.
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <Badge
                v-for="ing in selectedIngredients"
                :key="ing.ingredientId"
                class="flex items-center gap-2 py-1.5 px-3"
              >
                {{ ingredients.find(i => i.id === ing.ingredientId)?.name }}
                <div class="flex items-center gap-1">
                  <button type="button" class="hover:opacity-70" @click="updateQuantity(ing.ingredientId, -1)">
                    <Minus class="h-3 w-3" />
                  </button>
                  <span class="min-w-[20px] text-center">{{ ing.quantity }}</span>
                  <button type="button" class="hover:opacity-70" @click="updateQuantity(ing.ingredientId, 1)">
                    <Plus class="h-3 w-3" />
                  </button>
                </div>
              </Badge>
            </div>
          </div>

          <div class="space-y-2">
            <Label>Available Ingredients</Label>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                v-model="ingredientFilter"
                placeholder="Filter ingredients..."
                class="pl-9"
              />
            </div>
            <div class="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
              <Card
                v-for="ingredient in filteredIngredients"
                :key="ingredient.id"
                class="p-3 cursor-pointer transition-colors"
                :class="isSelected(ingredient.id) ? 'border-primary bg-primary/10' : 'hover:border-muted-foreground'"
                @click="toggleIngredient(ingredient.id)"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <div class="font-medium text-sm">{{ ingredient.name }}</div>
                    <div class="text-xs text-muted-foreground truncate">{{ ingredient.description }}</div>
                  </div>
                  <Badge v-if="isSelected(ingredient.id)" variant="default" class="text-xs">
                    x{{ getQuantity(ingredient.id) }}
                  </Badge>
                </div>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="emit('update:open', false)">
              Cancel
            </Button>
            <Button type="submit" :disabled="!canSubmit">
              {{ isEditing ? 'Save Changes' : 'Create Recipe' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </template>
  </Dialog>
</template>
