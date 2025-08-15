<template>
  <div class="item-view">
    <!-- Create Item Form -->
    <n-card title="Create New Item" class="create-form" size="medium">
      <n-form @submit.prevent="handleCreateItem" :model="newItem" label-placement="top">
        <n-form-item label="Item Name" path="name">
          <n-input
            v-model:value="newItem.name"
            placeholder="Enter item name"
            required
          />
        </n-form-item>

        <n-form-item label="Description" path="description">
          <n-input
            v-model:value="newItem.description"
            type="textarea"
            placeholder="Enter item description"
            :rows="3"
            required
          />
        </n-form-item>

        <n-space justify="end">
          <n-button @click="resetForm">Reset</n-button>
          <n-button type="primary" attr-type="submit">
            Create Item
          </n-button>
        </n-space>
      </n-form>
    </n-card>

    <!-- Existing Items List -->
    <div class="items-list">
      <n-empty v-if="items.length === 0" description="No items have been created yet." />
      <div v-else class="items-grid">
        <n-card
          v-for="item in items"
          :key="item.id"
          class="item-card"
          size="medium"
        >
          <template #header>
            <span>{{ item.name }}</span>
          </template>

          <p class="description">{{ item.description }}</p>

          <template #footer>
            <n-space justify="end">
              <n-button
                v-if="itemDeletability[item.id]?.canDelete"
                @click="handleDelete(item.id)"
                type="error"
                size="small"
              >
                <template #icon>
                  <n-icon><DeleteIcon /></n-icon>
                </template>
                Delete
              </n-button>
              <n-tooltip v-else-if="itemDeletability[item.id]?.reason" trigger="hover">
                <template #trigger>
                  <n-button
                    disabled
                    type="error"
                    size="small"
                  >
                    <template #icon>
                      <n-icon><DeleteIcon /></n-icon>
                    </template>
                    Delete
                  </n-button>
                </template>
                {{ itemDeletability[item.id]?.reason }}
              </n-tooltip>
            </n-space>
          </template>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useItemStore } from '@/store/item'
import { useInventoryStore } from '@/store/inventory'
import { useToast } from '@/composables/useToast'
import type { Item } from '@/store/item'
import {
  NButton,
  NInput,
  NForm,
  NFormItem,
  NSpace,
  NCard,
  NEmpty,
  NTooltip
} from 'naive-ui'
import { DeleteIcon } from '@vicons/ionicons5'

const itemStore = useItemStore()
const inventoryStore = useInventoryStore()
const toast = useToast()

const newItem = ref({
  name: '',
  description: ''
})

const items = ref<Item[]>([])
const itemDeletability = ref<Record<number, { canDelete: boolean; reason: string | null }>>({})

onMounted(async () => {
  await loadItems()
  await checkAllItemsDeletability()
})

const loadItems = async () => {
  await itemStore.getItems()
  items.value = itemStore.items
}

const checkAllItemsDeletability = async () => {
  for (const item of items.value) {
    const deletability = await itemStore.checkItemDeletability(item.id)
    itemDeletability.value[item.id] = deletability
  }
}

const handleCreateItem = async () => {
  try {
    await itemStore.createItem(newItem.value)
    // Refresh both item list and inventory
    await loadItems()
    await inventoryStore.getInventory()
    await checkAllItemsDeletability()
    resetForm()
    toast.success('Item created successfully!')
  } catch (error) {
    console.error('Error creating item:', error)
    toast.error('Failed to create item. Please try again.')
  }
}

const handleDelete = async (id: number) => {
  try {
    await itemStore.deleteItem(id)
    await loadItems()
    await checkAllItemsDeletability()
    toast.success('Item deleted successfully!')
  } catch (error: unknown) {
    console.error('Error deleting item:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete item. Please try again.'
    toast.error(errorMessage)
  }
}

const resetForm = () => {
  newItem.value = {
    name: '',
    description: ''
  }
}
</script>

<style scoped>
.item-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.items-list {
  margin-top: 30px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
</style>
