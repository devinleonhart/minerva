<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { Spell, CreateSpellRequest, UpdateSpellRequest } from '@/types/store/spells'
import { PageLayout } from '@/components/layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SpellList, SpellForm } from '@/components/features/spells'
import { Search, Loader2, Plus } from 'lucide-vue-next'

const spellsStore = useSpellsStore()
const { spells } = storeToRefs(spellsStore)
const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const showForm = ref(false)
const selectedSpell = ref<Spell | null>(null)

const { searchQuery, filteredItems } = useSearch({
  items: spells,
  searchFields: ['name']
})

const sortedSpells = computed(() =>
  [...filteredItems.value].sort((a, b) => a.name.localeCompare(b.name))
)

onMounted(async () => {
  isLoading.value = true
  try {
    await spellsStore.getSpells()
  } catch {
    toast.error('Failed to load spells')
  } finally {
    isLoading.value = false
  }
})

function handleAddSpell() {
  selectedSpell.value = null
  showForm.value = true
}

function handleEditSpell(spell: Spell) {
  selectedSpell.value = spell
  showForm.value = true
}

async function handleCreateSpell(data: CreateSpellRequest) {
  try {
    await spellsStore.createSpell(data)
    toast.success('Spell added successfully')
  } catch {
    toast.error('Failed to add spell')
  }
}

async function handleUpdateSpell(id: number, data: UpdateSpellRequest) {
  try {
    await spellsStore.updateSpell(id, data)
    toast.success('Spell updated successfully')
  } catch {
    toast.error('Failed to update spell')
  }
}

async function handleDeleteSpell(id: number) {
  const confirmed = await confirm.confirm({
    title: 'Delete Spell',
    message: 'Are you sure you want to delete this spell?',
    confirmText: 'Delete',
    variant: 'destructive'
  })

  if (!confirmed) return

  try {
    await spellsStore.deleteSpell(id)
    toast.success('Spell deleted successfully')
  } catch {
    toast.error('Failed to delete spell')
  }
}
</script>

<template>
  <PageLayout title="Spells" description="I accidentally burned it down...">
    <template #actions>
      <div class="flex items-center gap-2">
        <div class="relative w-64">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Search spells..."
            class="pl-9"
          />
        </div>
        <Button @click="handleAddSpell">
          <Plus class="mr-2 h-4 w-4" />
          Add Spell
        </Button>
      </div>
    </template>

    <Card>
      <CardContent class="p-0">
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>

        <div v-else-if="sortedSpells.length === 0" class="py-12 text-center text-muted-foreground">
          {{ searchQuery ? `No spells match "${searchQuery}"` : 'No spells yet. Add your first spell!' }}
        </div>

        <SpellList
          v-else
          :spells="sortedSpells"
          @edit="handleEditSpell"
          @delete="handleDeleteSpell"
        />
      </CardContent>
    </Card>

    <SpellForm
      :open="showForm"
      :spell="selectedSpell"
      @update:open="showForm = $event"
      @create="handleCreateSpell"
      @update="handleUpdateSpell"
    />
  </PageLayout>
</template>
