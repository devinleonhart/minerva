<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { Person, CreatePersonRequest, UpdatePersonRequest } from '@/types/store/people'
import { PageLayout } from '@/components/layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PersonList, PersonForm } from '@/components/features/people'
import { Search, Loader2, Plus } from 'lucide-vue-next'

const peopleStore = usePeopleStore()
const { people } = storeToRefs(peopleStore)
const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const showForm = ref(false)
const selectedPerson = ref<Person | null>(null)

const { searchQuery, filteredItems } = useSearch({
  items: people,
  searchFields: ['name', 'relationship', 'description', 'notableEvents']
})

const sortedPeople = computed(() =>
  [...filteredItems.value].sort((a, b) => {
    // Favorites first, then alphabetical
    if (a.isFavorited !== b.isFavorited) {
      return a.isFavorited ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
)

onMounted(async () => {
  isLoading.value = true
  try {
    await peopleStore.getPeople()
  } catch {
    toast.error('Failed to load people')
  } finally {
    isLoading.value = false
  }
})

function handleAddPerson() {
  selectedPerson.value = null
  showForm.value = true
}

function handleEditPerson(person: Person) {
  selectedPerson.value = person
  showForm.value = true
}

async function handleCreatePerson(data: CreatePersonRequest) {
  try {
    await peopleStore.createPerson(data)
    toast.success('Person added successfully')
  } catch {
    toast.error('Failed to add person')
  }
}

async function handleUpdatePerson(id: number, data: UpdatePersonRequest) {
  try {
    await peopleStore.updatePerson(id, data)
    toast.success('Person updated successfully')
  } catch {
    toast.error('Failed to update person')
  }
}

async function handleDeletePerson(id: number) {
  const confirmed = await confirm.confirm({
    title: 'Delete Person',
    message: 'Are you sure you want to delete this person?',
    confirmText: 'Delete',
    variant: 'destructive'
  })

  if (!confirmed) return

  try {
    await peopleStore.deletePerson(id)
    toast.success('Person deleted successfully')
  } catch {
    toast.error('Failed to delete person')
  }
}

async function handleToggleFavorite(id: number, isFavorited: boolean) {
  try {
    await peopleStore.toggleFavorite(id, isFavorited)
    toast.success(isFavorited ? 'Person favorited' : 'Person unfavorited')
  } catch {
    toast.error('Failed to update favorite status')
  }
}
</script>

<template>
  <PageLayout title="People" description="Faun, Faun... Come in Faun!">
    <template #actions>
      <div class="action-bar">
        <div class="search-group">
          <Search />
          <Input
            v-model="searchQuery"
            placeholder="Search people..."
          />
        </div>
        <Button @click="handleAddPerson">
          <Plus />
          Add Person
        </Button>
      </div>
    </template>

    <div v-if="isLoading" class="loading-center">
      <Loader2 />
    </div>

    <div v-else-if="sortedPeople.length === 0" class="empty-state">
      {{ searchQuery ? `No people match "${searchQuery}"` : 'No people yet. Add your first contact!' }}
    </div>

    <PersonList
      v-else
      :people="sortedPeople"
      @edit="handleEditPerson"
      @delete="handleDeletePerson"
      @toggle-favorite="handleToggleFavorite"
    />

    <PersonForm
      :open="showForm"
      :person="selectedPerson"
      @update:open="showForm = $event"
      @create="handleCreatePerson"
      @update="handleUpdatePerson"
    />
  </PageLayout>
</template>
