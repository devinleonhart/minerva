<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useIngredientStore } from '@/store/ingredient'
import { useInventoryStore } from '@/store/inventory'
import { useToast, useConfirm, useSearch } from '@/composables'
import type { Ingredient, IngredientForm as IIngredientForm, IngredientDeletability } from '@/types/store/ingredient'
import { PageLayout } from '@/components/layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IngredientList, IngredientForm } from '@/components/features/ingredients'
import { Search, Loader2, Plus } from 'lucide-vue-next'

const ingredientStore = useIngredientStore()
const inventoryStore = useInventoryStore()
const { ingredients } = storeToRefs(ingredientStore)
const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const showForm = ref(false)
const selectedIngredient = ref<Ingredient | null>(null)
const deletability = ref<Record<number, IngredientDeletability>>({})

const { searchQuery, filteredItems } = useSearch({
  items: ingredients,
  searchFields: ['name', 'description']
})

const sortedIngredients = computed(() =>
  [...filteredItems.value].sort((a, b) => a.name.localeCompare(b.name))
)

onMounted(async () => {
  isLoading.value = true
  try {
    await ingredientStore.getIngredients()
    await checkAllDeletability()
  } catch {
    toast.error('Failed to load ingredients')
  } finally {
    isLoading.value = false
  }
})

async function checkAllDeletability() {
  for (const ingredient of ingredients.value) {
    const result = await ingredientStore.checkIngredientDeletability(ingredient.id)
    deletability.value[ingredient.id] = result
  }
}

function handleAddIngredient() {
  selectedIngredient.value = null
  showForm.value = true
}

function handleEditIngredient(ingredient: Ingredient) {
  selectedIngredient.value = ingredient
  showForm.value = true
}

async function handleCreateIngredient(data: IIngredientForm) {
  try {
    await ingredientStore.addIngredient(data)
    await ingredientStore.getIngredients()
    await checkAllDeletability()
    toast.success('Ingredient added successfully')
  } catch {
    toast.error('Failed to add ingredient')
  }
}

async function handleUpdateIngredient(id: number, data: IIngredientForm) {
  try {
    await ingredientStore.updateIngredient(id, data)
    toast.success('Ingredient updated successfully')
  } catch {
    toast.error('Failed to update ingredient')
  }
}

async function handleDeleteIngredient(id: number) {
  const confirmed = await confirm.confirm({
    title: 'Delete Ingredient',
    message: 'Are you sure you want to delete this ingredient?',
    confirmText: 'Delete',
    variant: 'destructive'
  })

  if (!confirmed) return

  try {
    await ingredientStore.deleteIngredient(id)
    await ingredientStore.getIngredients()
    await checkAllDeletability()
    toast.success('Ingredient deleted successfully')
  } catch {
    toast.error('Failed to delete ingredient')
  }
}

async function handleToggleSecured(id: number, secured: boolean) {
  try {
    await ingredientStore.toggleSecured(id, secured)
    toast.success(secured ? 'Ingredient secured' : 'Ingredient unsecured')
  } catch {
    toast.error('Failed to update ingredient')
  }
}

async function handleAddToInventory(ingredientId: number, quality: 'HQ' | 'NORMAL' | 'LQ') {
  try {
    await inventoryStore.addToInventory({
      ingredientId,
      quality,
      quantity: 1
    })
    const qualityText = quality === 'HQ' ? 'High Quality' : quality === 'LQ' ? 'Low Quality' : 'Normal Quality'
    toast.success(`${qualityText} ingredient added to inventory`)
  } catch {
    toast.error('Failed to add to inventory')
  }
}
</script>

<template>
  <PageLayout title="Ingredients" description="Why only have one when I can have two?">
    <template #actions>
      <div class="flex items-center gap-2">
        <div class="relative w-64">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Search ingredients..."
            class="pl-9"
          />
        </div>
        <Button @click="handleAddIngredient">
          <Plus class="mr-2 h-4 w-4" />
          Add Ingredient
        </Button>
      </div>
    </template>

    <Card>
      <CardContent class="p-0">
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>

        <div v-else-if="sortedIngredients.length === 0" class="py-12 text-center text-muted-foreground">
          {{ searchQuery ? `No ingredients match "${searchQuery}"` : 'No ingredients yet. Add your first ingredient!' }}
        </div>

        <IngredientList
          v-else
          :ingredients="sortedIngredients"
          :deletability="deletability"
          @edit="handleEditIngredient"
          @delete="handleDeleteIngredient"
          @toggle-secured="handleToggleSecured"
          @add-to-inventory="handleAddToInventory"
        />
      </CardContent>
    </Card>

    <IngredientForm
      :open="showForm"
      :ingredient="selectedIngredient"
      @update:open="showForm = $event"
      @create="handleCreateIngredient"
      @update="handleUpdateIngredient"
    />
  </PageLayout>
</template>
