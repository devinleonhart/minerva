<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { AddCurrencyRequest } from '@/types/store/inventory'
import { PageLayout } from '@/components/layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  InventorySection,
  IngredientInventoryList,
  PotionInventoryList,
  ItemInventoryList,
  CurrencyList,
  AddCurrencyForm,
  AddItemForm
} from '@/components/features/inventory'
import { Search, Loader2, Coins, Package } from 'lucide-vue-next'

const inventoryStore = useInventoryStore()
const { inventoryItems, potionItems, itemItems, currencies } = storeToRefs(inventoryStore)
const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const searchQuery = ref('')
const showAddCurrencyForm = ref(false)
const showAddItemForm = ref(false)

const filteredIngredients = computed(() => {
  if (!inventoryItems.value?.length) return []

  let filtered = inventoryItems.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.ingredient.name.toLowerCase().includes(query) ||
      item.ingredient.description?.toLowerCase().includes(query)
    )
  }
  return filtered.sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name))
})

const filteredPotions = computed(() => {
  if (!potionItems.value?.length) return []

  let filtered = potionItems.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.potion.recipe?.name?.toLowerCase().includes(query)
    )
  }
  return filtered.sort((a, b) => {
    const nameA = a.potion?.recipe?.name || ''
    const nameB = b.potion?.recipe?.name || ''
    return nameA.localeCompare(nameB)
  })
})

const filteredItems = computed(() => {
  if (!itemItems.value?.length) return []

  let filtered = itemItems.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.item.name.toLowerCase().includes(query) ||
      item.item.description?.toLowerCase().includes(query)
    )
  }
  return filtered.sort((a, b) => a.item.name.localeCompare(b.item.name))
})

const filteredCurrencies = computed(() => {
  if (!currencies.value?.length) return []

  let filtered = currencies.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(c => c.name.toLowerCase().includes(query))
  }
  return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

const isEmpty = computed(() =>
  !filteredIngredients.value.length &&
  !filteredPotions.value.length &&
  !filteredItems.value.length &&
  !filteredCurrencies.value.length
)

onMounted(async () => {
  isLoading.value = true
  try {
    await inventoryStore.getInventory()
  } catch {
    toast.error('Failed to load inventory')
  } finally {
    isLoading.value = false
  }
})

// Ingredient handlers
async function handleUpdateIngredientQuantity(id: number, quality: string, quantity: number) {
  try {
    await inventoryStore.updateInventoryItem(id, quality, quantity)
    toast.success('Quantity updated')
  } catch {
    toast.error('Failed to update quantity')
  }
}

async function handleDeleteIngredient(id: number) {
  const confirmed = await confirm.confirm({
    title: 'Remove Ingredient',
    message: 'Remove this ingredient from inventory?',
    confirmText: 'Remove',
    variant: 'destructive'
  })
  if (!confirmed) return

  try {
    await inventoryStore.deleteInventoryItem(id)
    await inventoryStore.getInventory()
    toast.success('Ingredient removed')
  } catch {
    toast.error('Failed to remove ingredient')
  }
}

// Potion handlers
async function handleUpdatePotionQuantity(id: number, quantity: number) {
  try {
    await inventoryStore.updatePotionInventoryItem(id, quantity)
    toast.success('Quantity updated')
  } catch {
    toast.error('Failed to update quantity')
  }
}

async function handleDeletePotion(id: number) {
  const confirmed = await confirm.confirm({
    title: 'Remove Potion',
    message: 'Remove this potion from inventory?',
    confirmText: 'Remove',
    variant: 'destructive'
  })
  if (!confirmed) return

  try {
    await inventoryStore.deletePotionFromInventory(id)
    await inventoryStore.getInventory()
    toast.success('Potion removed')
  } catch {
    toast.error('Failed to remove potion')
  }
}

// Item handlers
async function handleUpdateItemQuantity(id: number, quantity: number) {
  try {
    await inventoryStore.updateItemInventoryItem(id, quantity)
    toast.success('Quantity updated')
  } catch {
    toast.error('Failed to update quantity')
  }
}

async function handleDeleteItem(id: number) {
  const confirmed = await confirm.confirm({
    title: 'Remove Item',
    message: 'Remove this item from inventory?',
    confirmText: 'Remove',
    variant: 'destructive'
  })
  if (!confirmed) return

  try {
    await inventoryStore.deleteItemFromInventory(id)
    await inventoryStore.getInventory()
    toast.success('Item removed')
  } catch {
    toast.error('Failed to remove item')
  }
}

// Currency handlers
async function handleAddCurrency(data: AddCurrencyRequest) {
  try {
    await inventoryStore.addCurrency(data.name, data.value)
    await inventoryStore.getInventory()
    toast.success('Currency added')
  } catch {
    toast.error('Failed to add currency')
  }
}

async function handleUpdateCurrencyValue(id: number, value: number) {
  try {
    await inventoryStore.updateCurrency(id, value)
    toast.success('Currency updated')
  } catch {
    toast.error('Failed to update currency')
  }
}

async function handleDeleteCurrency(id: number) {
  const confirmed = await confirm.confirm({
    title: 'Remove Currency',
    message: 'Remove this currency?',
    confirmText: 'Remove',
    variant: 'destructive'
  })
  if (!confirmed) return

  try {
    await inventoryStore.deleteCurrency(id)
    await inventoryStore.getInventory()
    toast.success('Currency removed')
  } catch {
    toast.error('Failed to remove currency')
  }
}

// Add item handler
async function handleAddItem(data: { name: string; description: string; quantity: number }) {
  try {
    await inventoryStore.addItemToInventory({
      name: data.name,
      description: data.description,
      quantity: data.quantity
    })
    await inventoryStore.getInventory()
    toast.success('Item added to inventory')
  } catch {
    toast.error('Failed to add item')
  }
}
</script>

<template>
  <PageLayout title="Inventory" description="This is the worst knapsack I've ever had!">
    <template #actions>
      <div class="flex items-center gap-2">
        <div class="relative w-64">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Search inventory..."
            class="pl-9"
          />
        </div>
        <Button @click="showAddCurrencyForm = true" variant="outline">
          <Coins class="mr-2 h-4 w-4" />
          Add Currency
        </Button>
        <Button @click="showAddItemForm = true">
          <Package class="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>
    </template>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <div v-else-if="isEmpty" class="py-12 text-center text-muted-foreground">
      {{ searchQuery ? `No items match "${searchQuery}"` : 'Your inventory is empty. Add some items to get started!' }}
    </div>

    <template v-else>
      <InventorySection
        v-if="filteredPotions.length"
        title="Potions"
      >
        <PotionInventoryList
          :items="filteredPotions"
          @update-quantity="handleUpdatePotionQuantity"
          @delete="handleDeletePotion"
        />
      </InventorySection>

      <InventorySection
        v-if="filteredIngredients.length"
        title="Ingredients"
      >
        <IngredientInventoryList
          :items="filteredIngredients"
          @update-quantity="handleUpdateIngredientQuantity"
          @delete="handleDeleteIngredient"
        />
      </InventorySection>

      <InventorySection
        v-if="filteredItems.length"
        title="Items"
      >
        <ItemInventoryList
          :items="filteredItems"
          @update-quantity="handleUpdateItemQuantity"
          @delete="handleDeleteItem"
        />
      </InventorySection>

      <InventorySection
        v-if="filteredCurrencies.length"
        title="Currencies"
      >
        <CurrencyList
          :currencies="filteredCurrencies"
          @update-value="handleUpdateCurrencyValue"
          @delete="handleDeleteCurrency"
        />
      </InventorySection>
    </template>

    <AddCurrencyForm
      :open="showAddCurrencyForm"
      @update:open="showAddCurrencyForm = $event"
      @submit="handleAddCurrency"
    />

    <AddItemForm
      :open="showAddItemForm"
      @update:open="showAddItemForm = $event"
      @submit="handleAddItem"
    />
  </PageLayout>
</template>
