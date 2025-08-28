<template>
  <ViewLayout>
    <ViewHeader
      :show-search="true"
      search-placeholder="Search people..."
      :search-value="searchQuery"
      @update:search-value="searchQuery = $event"
    >
      <template #left>
        <n-button @click="showAddPersonModal = true" type="primary" size="large">
          Add New Person
        </n-button>
      </template>
    </ViewHeader>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-indicator" style="text-align: center; padding: 40px; color: #888;">
      Loading people...
    </div>

    <n-empty v-if="!isLoading && filteredPeople.length === 0" :description="searchQuery ? `No people found matching '${searchQuery}'` : 'No people have been added yet. Add your first person!'" />

    <!-- People List -->
    <div v-if="!isLoading && filteredPeople.length > 0">
      <GridLayout variant="default">
        <n-card
          v-for="person in filteredPeople"
          :key="person.id"
          class="person-item"
          :class="{ 'favorited': person.isFavorited }"
          size="medium"
          @click="selectPerson(person)"
        >
          <template #header>
            <div class="person-header">
              <CardHeader :title="person.name" />
              <span
                class="favorite-star"
                :class="{ 'favorited': person.isFavorited }"
                @click.stop="toggleFavorite(person.id, !person.isFavorited)"
                :title="person.isFavorited ? 'Favorited - click to unfavorite' : 'Not favorited - click to favorite'"
              >
                ★
              </span>
            </div>
          </template>

          <div class="person-content">
            <div v-if="person.relationship" class="person-relationship">
              <strong>Relationship:</strong> {{ person.relationship }}
            </div>
            <div v-if="person.description" class="person-description">
              {{ person.description }}
            </div>
          </div>

          <div class="person-controls">
            <n-button
              @click.stop="editPerson(person)"
              type="info"
              size="small"
            >
              Edit
            </n-button>
            <n-button
              @click.stop="deletePerson(person.id)"
              type="error"
              size="small"
            >
              Delete
            </n-button>
          </div>
        </n-card>
      </GridLayout>
    </div>

    <!-- Add Person Modal -->
    <AddPersonModal v-model="showAddPersonModal" />

    <!-- Edit Person Modal -->
    <EditPersonModal
      v-model="showEditPersonModal"
      :person="selectedPerson"
      v-if="selectedPerson"
    />
  </ViewLayout>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePeopleStore } from '@/store/people'
import { useToast } from '@/composables/useToast'
import type { Person } from '../types/store/people'
import {
  NButton,
  NCard,
  NEmpty
} from 'naive-ui'
import ViewLayout from '@/components/shared/ViewLayout.vue'
import ViewHeader from '@/components/shared/ViewHeader.vue'
import GridLayout from '@/components/shared/GridLayout.vue'
import CardHeader from '@/components/shared/CardHeader.vue'
import AddPersonModal from '@/components/people/AddPersonModal.vue'
import EditPersonModal from '@/components/people/EditPersonModal.vue'

const peopleStore = usePeopleStore()
const toast = useToast()
const { people } = storeToRefs(peopleStore)
const searchQuery = ref('')
const isLoading = ref(false)
const showAddPersonModal = ref(false)
const showEditPersonModal = ref(false)
const selectedPerson = ref<Person | null>(null)

const filteredPeople = computed(() => {
  if (!people.value || !Array.isArray(people.value)) return []

  let filtered = people.value

  if (searchQuery.value) {
    filtered = filtered.filter(person =>
      person?.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      person?.description?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      person?.relationship?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      person?.notableEvents?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

onMounted(async () => {
  isLoading.value = true
  try {
    await peopleStore.getPeople()
  } catch (error) {
    console.error('Failed to load people:', error)
    toast.error('Failed to load people. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
})

const selectPerson = (person: Person) => {
  selectedPerson.value = person
  showEditPersonModal.value = true
}

const editPerson = (person: Person) => {
  selectedPerson.value = person
  showEditPersonModal.value = true
}

const deletePerson = async (id: number) => {
  try {
    await peopleStore.deletePerson(id)
    toast.success('Person removed successfully!')
  } catch (error) {
    console.error('Error deleting person:', error)
    toast.error('Failed to remove person. Please try again.')
  }
}

const toggleFavorite = async (id: number, isFavorited: boolean) => {
  try {
    await peopleStore.toggleFavorite(id, isFavorited)
    toast.success(isFavorited ? 'Person favorited!' : 'Person unfavorited!')
  } catch (error) {
    console.error('Error toggling favorite:', error)
    toast.error('Failed to update favorite status. Please try again.')
  }
}
</script>

<style scoped>
.person-item {
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 4px solid #e0e0e0;
}

.person-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.person-item.favorited {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%);
}

.person-header {
  position: relative;
  width: 100%;
}

.favorite-star {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 20px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  color: #e0e0e0;
  z-index: 10;
}

.favorite-star:hover {
  transform: scale(1.1);
}

.favorite-star.favorited {
  color: #f59e0b;
}

.favorite-star.favorited:hover {
  color: #d97706;
}

.person-content {
  margin-top: 8px;
  margin-bottom: 12px;
}

.person-relationship {
  margin-bottom: 8px;
  font-size: 14px;
  color: #888;
}

.person-description {
  color: #666;
  line-height: 1.5;
  font-size: 14px;
}

.person-controls {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
}

.loading-indicator {
  text-align: center;
  padding: 40px;
  color: #888;
}
</style>
