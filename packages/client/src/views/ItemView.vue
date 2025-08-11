<template>
  <div class="item-view">
    <h1>Items</h1>

    <!-- Create Item Form -->
    <div class="create-form">
      <h2>Create New Item</h2>
      <form @submit.prevent="handleCreateItem" class="item-form">
        <div class="form-group">
          <label for="itemName">Item Name:</label>
          <input
            id="itemName"
            v-model="newItem.name"
            type="text"
            required
            class="form-input"
            placeholder="Enter item name"
          />
        </div>

        <div class="form-group">
          <label for="itemDescription">Description:</label>
          <textarea
            id="itemDescription"
            v-model="newItem.description"
            required
            class="form-textarea"
            placeholder="Enter item description"
            rows="3"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="create-btn">Create Item</button>
          <button type="button" @click="resetForm" class="reset-btn">Reset</button>
        </div>
      </form>
    </div>

    <!-- Existing Items List -->
    <div class="items-list">
      <h2>Existing Items</h2>
      <div v-if="items.length === 0" class="empty-state">
        <p>No items have been created yet.</p>
      </div>
      <div v-else class="items-grid">
        <div
          v-for="item in items"
          :key="item.id"
          class="item-card"
        >
          <h3>{{ item.name }}</h3>
          <p class="description">{{ item.description }}</p>
          <div class="item-meta">
            <span class="created-date">Created: {{ formatDate(item.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useItemStore } from '@/store/item'
import { useInventoryStore } from '@/store/inventory'

const itemStore = useItemStore()
const inventoryStore = useInventoryStore()

const newItem = ref({
  name: '',
  description: ''
})

const items = ref([])

onMounted(async () => {
  await loadItems()
})

const loadItems = async () => {
  await itemStore.getItems()
  items.value = itemStore.items
}

const handleCreateItem = async () => {
  try {
    await itemStore.createItem(newItem.value)
    // Refresh both item list and inventory
    await loadItems()
    await inventoryStore.getInventory()
    resetForm()
  } catch (error) {
    console.error('Error creating item:', error)
  }
}

const resetForm = () => {
  newItem.value = {
    name: '',
    description: ''
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
.item-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.create-form {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.create-form h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.item-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.create-btn {
  padding: 10px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.create-btn:hover {
  background: #218838;
}

.reset-btn {
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.reset-btn:hover {
  background: #545b62;
}

.items-list h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.item-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #fd7e14;
}

.item-card h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.description {
  color: #666;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.4;
}

.item-meta {
  font-size: 12px;
  color: #999;
}

.created-date {
  display: block;
}
</style>
