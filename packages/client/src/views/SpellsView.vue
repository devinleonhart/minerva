<template>
  <ViewLayout>
    <ViewHeader
      :show-search="true"
      search-placeholder="Search spells..."
      :search-value="searchQuery"
      @update:search-value="searchQuery = $event"
    >
      <template #right>
        <n-button type="primary" size="large" @click="showAddSpellModal = true">
          Add New Spell
        </n-button>
      </template>
    </ViewHeader>

    <div v-if="isLoading" class="loading-indicator">
      Loading spells...
    </div>

    <n-empty
      v-else-if="filteredSpells.length === 0"
      :description="searchQuery ? `No spells match '${searchQuery}'` : 'No spells yet. Add your first spell!'"
    />

    <ResourceList v-else>
      <ResourceRow
        v-for="spell in filteredSpells"
        :key="spell.id"
        :title="spell.name"
        :subtitle="spell.isLearned ? 'Learned spell' : `Stars ${spell.currentStars}/${spell.neededStars}`"
        :indicator="spell.isLearned ? 'success' : 'warning'"
      >
        <div class="spell-stars" v-if="!spell.isLearned">
          <span
            v-for="i in spell.neededStars"
            :key="i"
            class="star"
            :class="{ filled: i <= spell.currentStars }"
          >
            ★
          </span>
        </div>

        <template #actions>
          <div class="spell-actions">
            <n-button type="info" size="small" @click="editSpell(spell)">
              Edit
            </n-button>
            <n-button type="error" size="small" @click="deleteSpell(spell.id)">
              Delete
            </n-button>
          </div>
        </template>
      </ResourceRow>
    </ResourceList>

    <AddSpellModal v-model="showAddSpellModal" />
    <EditSpellModal
      v-if="selectedSpell"
      v-model="showEditSpellModal"
      :spell="selectedSpell"
    />
  </ViewLayout>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSpellsStore } from '@/store/spells'
import type { Spell } from '../types/store/spells'
import {
  NButton,
  NEmpty
} from 'naive-ui'
import ViewLayout from '@/components/shared/ViewLayout.vue'
import ViewHeader from '@/components/shared/ViewHeader.vue'
import ResourceList from '@/components/shared/ResourceList.vue'
import ResourceRow from '@/components/shared/ResourceRow.vue'
import AddSpellModal from '@/components/spells/AddSpellModal.vue'
import EditSpellModal from '@/components/spells/EditSpellModal.vue'

const spellsStore = useSpellsStore()
const { spells } = storeToRefs(spellsStore)

const searchQuery = ref('')
const isLoading = ref(false)
const showAddSpellModal = ref(false)
const showEditSpellModal = ref(false)
const selectedSpell = ref<Spell | null>(null)

const filteredSpells = computed(() => {
  let list = spells.value ?? []
  if (searchQuery.value) {
    const term = searchQuery.value.toLowerCase()
    list = list.filter((spell) =>
      spell.name.toLowerCase().includes(term)
    )
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
})

onMounted(async () => {
  isLoading.value = true
  try {
    await spellsStore.getSpells()
  } catch (error) {
    console.error('Failed to load spells. Please refresh.', error)
  } finally {
    isLoading.value = false
  }
})

const editSpell = (spell: Spell) => {
  selectedSpell.value = spell
  showEditSpellModal.value = true
}

const deleteSpell = async (id: number) => {
  try {
    await spellsStore.deleteSpell(id)
    console.log('Spell removed successfully!')
  } catch (error) {
    console.error('Failed to remove spell. Please try again.', error)
  }
}
</script>

<style scoped>
.loading-indicator {
  text-align: center;
  padding: 40px;
  color: #888;
}

.spell-stars {
  display: flex;
  gap: 4px;
  color: #e0e0e0;
  font-size: 18px;
}

.spell-stars .star {
  font-size: 18px;
}

.spell-stars .star.filled {
  color: #f59e0b;
}

.spell-actions {
  display: flex;
  gap: 8px;
}
</style>
