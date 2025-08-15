<template>
  <ViewLayout>
    <ViewHeader
      :show-search="true"
      search-placeholder="Search ingredients..."
      :search-value="searchQuery"
      @update:search-value="searchQuery = $event"
    >
      <template #left>
        <n-button @click="showCreateModal = true" type="primary" size="large">
          Add New Ingredient
        </n-button>
      </template>
    </ViewHeader>

    <CreateEntityModal
      v-model:modelValue="showCreateModal"
      title="Add New Ingredient"
      submit-button-text="Add Ingredient"
      @submit="handleCreateIngredient"
      @cancel="showCreateModal = false"
    />

    <IngredientList :search-query="searchQuery" />
  </ViewLayout>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useIngredientStore } from '@/store/ingredient'
import { useToast } from '@/composables/useToast'
import type { CreateEntityFormData } from '@/types/components'
import { NButton } from 'naive-ui'
import ViewLayout from '@/components/shared/ViewLayout.vue'
import ViewHeader from '@/components/shared/ViewHeader.vue'
import IngredientList from '@/components/ingredient/IngredientList.vue'
import CreateEntityModal from '@/components/shared/CreateEntityModal.vue'

const ingredientStore = useIngredientStore()
const toast = useToast()
const showCreateModal = ref(false)
const searchQuery = ref('')

const handleCreateIngredient = async (data: CreateEntityFormData) => {
  try {
    await ingredientStore.addIngredient(data)
    await ingredientStore.getIngredients()
    showCreateModal.value = false
    toast.success('Ingredient added successfully!')
  } catch (error) {
    console.error('Error adding ingredient:', error)
    toast.error('Failed to add ingredient. Please try again.')
  }
}
</script>

<style scoped>
.ingredient-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #1a1a1a;
  min-height: 100vh;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.header-left {
  flex-shrink: 0;
}

.header-right {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

/* Responsive design for small screens */
@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-right {
    max-width: none;
  }
}
</style>
