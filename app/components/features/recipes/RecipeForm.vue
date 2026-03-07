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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ title }}</DialogTitle>
        </DialogHeader>

        <form class="form" @submit.prevent="handleSubmit">
          <div class="field">
            <Label for="name">Recipe Name</Label>
            <Input
              id="name"
              v-model="name"
              placeholder="Enter recipe name"
            />
          </div>

          <div class="field">
            <Label for="description">Description</Label>
            <Textarea
              id="description"
              v-model="description"
              placeholder="Enter recipe description"
              :rows="3"
            />
          </div>

          <div class="field">
            <Label>Selected Ingredients</Label>
            <div v-if="selectedIngredients.length === 0" class="empty-state">
              No ingredients selected. Add some from below.
            </div>
            <div v-else class="badge-group">
              <Badge
                v-for="ing in selectedIngredients"
                :key="ing.ingredientId"
              >
                {{ ingredients.find(i => i.id === ing.ingredientId)?.name }}
                <div class="qty-ctrl">
                  <button class="icon-btn" type="button" @click="updateQuantity(ing.ingredientId, -1)">
                    <Minus />
                  </button>
                  <span class="qty">{{ ing.quantity }}</span>
                  <button class="icon-btn" type="button" @click="updateQuantity(ing.ingredientId, 1)">
                    <Plus />
                  </button>
                </div>
              </Badge>
            </div>
          </div>

          <div class="field">
            <Label>Available Ingredients</Label>
            <div class="search-row">
              <Search />
              <Input
                v-model="ingredientFilter"
                placeholder="Filter ingredients..."
              />
            </div>
            <div class="ingredient-picker">
              <Card
                v-for="ingredient in filteredIngredients"
                :key="ingredient.id"
                :class="'ingredient-card' + (isSelected(ingredient.id) ? ' selected' : '')"
                @click="toggleIngredient(ingredient.id)"
              >
                <div class="ingredient-card-inner">
                  <div class="info-cell">
                    <div class="name">{{ ingredient.name }}</div>
                    <div class="sub">{{ ingredient.description }}</div>
                  </div>
                  <Badge v-if="isSelected(ingredient.id)" variant="default">
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

<style scoped>
.search-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-muted-foreground);
  margin-bottom: 0.5rem;
}

.ingredient-picker {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-height: 14rem;
  overflow-y: auto;
  padding-right: 0.125rem;
}

.ingredient-card {
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}

.ingredient-card:hover {
  border-color: var(--color-primary);
}

.ingredient-card.selected {
  border-color: var(--color-primary);
  background-color: color-mix(in srgb, var(--color-primary) 8%, var(--color-card));
}

.ingredient-card-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
}
</style>
