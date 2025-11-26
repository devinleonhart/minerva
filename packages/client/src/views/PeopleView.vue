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
      <ResourceList>
        <ResourceRow
          v-for="person in filteredPeople"
          :key="person.id"
          :title="person.name"
          :subtitle="person.relationship || ''"
        >
          <template #leading>
            <div class="person-leading">
              <span
                class="favorite-star"
                :class="{ favorited: person.isFavorited }"
                @click.stop="toggleFavorite(person.id, !person.isFavorited)"
                :title="person.isFavorited ? 'Favorited - click to unfavorite' : 'Not favorited - click to favorite'"
              >
                ★
              </span>
              <div class="person-leading-text">
                <p class="person-name">{{ person.name }}</p>
                <p class="person-relationship" v-if="person.relationship">{{ person.relationship }}</p>
              </div>
            </div>
          </template>

          <div class="person-notes" v-if="person.description || person.notableEvents">
            <span v-if="person.description" class="person-description" :title="person.description">
              {{ person.description }}
            </span>
            <span v-if="person.notableEvents" class="person-events" :title="person.notableEvents">
              {{ person.notableEvents }}
            </span>
          </div>

          <template #actions>
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
          </template>
        </ResourceRow>
      </ResourceList>
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
  NEmpty
} from 'naive-ui'
import ViewLayout from '@/components/shared/ViewLayout.vue'
import ViewHeader from '@/components/shared/ViewHeader.vue'
import ResourceList from '@/components/shared/ResourceList.vue'
import ResourceRow from '@/components/shared/ResourceRow.vue'
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
.favorite-star {
  font-size: 18px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  color: #e0e0e0;
}

.favorite-star:hover {
  transform: scale(1.1);
}

.favorite-star.favorited {
  color: #f59e0b;
}

.person-leading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.person-leading-text {
  min-width: 0;
}

.person-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
}

.person-relationship {
  margin: 0;
  font-size: 12px;
  color: #cfcfcf;
}

.person-notes {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  overflow: hidden;
  color: #b5b5b5;
  font-size: 12px;
}

.person-description,
.person-events {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.person-events {
  color: #7ddba3;
}

.person-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.loading-indicator {
  text-align: center;
  padding: 40px;
  color: #888;
}
</style>
