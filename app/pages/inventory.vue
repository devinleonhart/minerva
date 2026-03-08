<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { AddCurrencyRequest, ItemInventoryItem } from '@/types/store/inventory'
import { PageLayout } from '@/components/layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  IngredientInventoryList,
  PotionInventoryList,
  ItemInventoryList,
  CurrencyList,
  AddCurrencyForm,
  AddItemForm,
  EditInventoryItemForm
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
const editingInventoryItem = ref<ItemInventoryItem | null>(null)
const activeTab = ref<'potions' | 'ingredients' | 'items' | 'currencies'>('potions')

const tabs = computed(() => [
  { key: 'potions' as const, label: 'Potions', count: filteredPotions.value.length },
  { key: 'ingredients' as const, label: 'Ingredients', count: filteredIngredients.value.length },
  { key: 'items' as const, label: 'Items', count: filteredItems.value.length },
  { key: 'currencies' as const, label: 'Currencies', count: filteredCurrencies.value.length },
])

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
async function handleEditItem(item: ItemInventoryItem) {
  editingInventoryItem.value = item
}

async function handleEditItemSubmit(id: number, quantity: number) {
  try {
    await inventoryStore.updateItemInventoryItem(id, quantity)
    toast.success('Item updated')
  } catch {
    toast.error('Failed to update item')
  }
}

async function handleUpdateItemQuantity(id: number, quantity: number) {
  try {
    await inventoryStore.updateItemInventoryItem(id, quantity)
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
      <div class="action-bar">
        <div class="search-group">
          <Search />
          <Input
            v-model="searchQuery"
            placeholder="Search inventory..."
          />
        </div>
        <Button v-if="activeTab === 'currencies'" @click="showAddCurrencyForm = true">
          <Coins />
          Add Currency
        </Button>
        <Button v-if="activeTab === 'items'" @click="showAddItemForm = true">
          <Package />
          Add Item
        </Button>
      </div>
    </template>

    <div v-if="isLoading" class="loading-center">
      <Loader2 />
    </div>

    <div v-else class="tab-container">
      <div class="tab-strip">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <div class="tab-panel">
        <template v-if="activeTab === 'potions'">
          <div v-if="!filteredPotions.length" class="empty-state">
            {{ searchQuery ? `No potions match "${searchQuery}"` : 'No potions in inventory.' }}
          </div>
          <PotionInventoryList
            v-else
            :items="filteredPotions"
            @update-quantity="handleUpdatePotionQuantity"
            @delete="handleDeletePotion"
          />
        </template>

        <template v-else-if="activeTab === 'ingredients'">
          <div v-if="!filteredIngredients.length" class="empty-state">
            {{ searchQuery ? `No ingredients match "${searchQuery}"` : 'No ingredients in inventory.' }}
          </div>
          <IngredientInventoryList
            v-else
            :items="filteredIngredients"
            @update-quantity="handleUpdateIngredientQuantity"
            @delete="handleDeleteIngredient"
          />
        </template>

        <template v-else-if="activeTab === 'items'">
          <div v-if="!filteredItems.length" class="empty-state">
            {{ searchQuery ? `No items match "${searchQuery}"` : 'No items in inventory.' }}
          </div>
          <ItemInventoryList
            v-else
            :items="filteredItems"
            @edit="handleEditItem"
            @update-quantity="handleUpdateItemQuantity"
            @delete="handleDeleteItem"
          />
        </template>

        <template v-else-if="activeTab === 'currencies'">
          <div v-if="!filteredCurrencies.length" class="empty-state">
            {{ searchQuery ? `No currencies match "${searchQuery}"` : 'No currencies tracked yet.' }}
          </div>
          <CurrencyList
            v-else
            :currencies="filteredCurrencies"
            @update-value="handleUpdateCurrencyValue"
            @delete="handleDeleteCurrency"
          />
        </template>
      </div>
    </div>

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

    <EditInventoryItemForm
      :open="editingInventoryItem !== null"
      :item="editingInventoryItem"
      @update:open="if (!$event) editingInventoryItem = null"
      @submit="handleEditItemSubmit"
    />
  </PageLayout>
</template>

<style scoped>
.tab-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tab-strip {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  color: var(--color-muted-foreground);
  transition: color 0.15s, border-color 0.15s;
  font-family: inherit;
}

.tab-btn:hover {
  color: var(--color-foreground);
}

.tab-btn.active {
  color: var(--color-foreground);
  border-bottom-color: var(--color-primary);
}

.tab-count {
  font-size: 0.75rem;
  font-weight: 400;
  background-color: var(--color-accent);
  color: var(--color-muted-foreground);
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  min-width: 1.25rem;
  text-align: center;
}

.tab-btn.active .tab-count {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
}

.tab-panel {
  min-height: 6rem;
}
</style>
