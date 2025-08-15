<template>
  <ViewLayout>
    <ViewHeader :show-search="true" search-placeholder="Search spells & skills..." :search-value="searchQuery" @update:search-value="searchQuery = $event" />

    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-indicator" style="text-align: center; padding: 40px; color: #888;">
      Loading spells and skills...
    </div>

    <div v-if="!isLoading" class="main-content">
      <!-- Skills Section -->
      <div class="section">
        <h2 class="section-title">Skills</h2>

        <!-- Add Skill Section -->
        <div class="add-section">
          <n-input
            v-model:value="newSkillName"
            placeholder="Enter skill name (e.g., Strong, Fast, Clever)"
            @keyup.enter="addSkill"
            style="max-width: 400px;"
          />
          <n-button @click="addSkill" type="primary" :disabled="!newSkillName.trim()">
            Add Skill
          </n-button>
        </div>

        <!-- Skills List -->
        <div v-if="filteredSkills.length > 0" class="skills-list">
          <n-card v-for="skill in filteredSkills" :key="skill.id" class="skill-item" size="small">
            <div class="skill-content">
              <span class="skill-name">{{ skill.name }}</span>
              <n-button
                @click="deleteSkill(skill.id)"
                type="error"
                size="small"
                ghost
              >
                Delete
              </n-button>
            </div>
          </n-card>
        </div>

        <n-empty v-else-if="searchQuery" description="No skills found matching your search" />
        <n-empty v-else description="No skills added yet. Add your first skill above!" />
      </div>

      <!-- Spells Section -->
      <div class="section">
        <h2 class="section-title">Spells</h2>

        <!-- Add Spell Section -->
        <div class="add-section">
          <n-button @click="showAddSpellModal = true" type="primary">
            Add New Spell
          </n-button>
        </div>

        <!-- Spells List -->
        <div v-if="filteredSpells.length > 0" class="spells-list">
          <n-card v-for="spell in filteredSpells" :key="spell.id" class="spell-item" size="medium">
            <template #header>
              <div class="spell-header">
                <span class="spell-name">
                  {{ spell.name }}
                </span>
                <span v-if="spell.isLearned" class="learned-badge">✓ Learned</span>
              </div>
            </template>

            <div class="spell-content">
              <!-- Stars - only visible when not learned -->
              <div v-if="!spell.isLearned" class="spell-stars">
                <div class="stars-container">
                  <span
                    v-for="i in spell.neededStars"
                    :key="i"
                    class="star"
                    :class="{
                      'filled': i <= spell.currentStars,
                      'empty': i > spell.currentStars
                    }"
                  >
                    ★
                  </span>
                </div>
              </div>

              <div class="spell-controls">
                <n-button
                  @click="editSpell(spell)"
                  type="info"
                  size="small"
                >
                  Edit
                </n-button>
                <n-button
                  @click="deleteSpell(spell.id)"
                  type="error"
                  size="small"
                >
                  Delete
                </n-button>
              </div>
            </div>
          </n-card>
        </div>

        <n-empty v-else-if="searchQuery" description="No spells found matching your search" />
        <n-empty v-else description="No spells added yet. Add your first spell above!" />
      </div>
    </div>

    <!-- Add Spell Modal -->
    <AddSpellModal v-model="showAddSpellModal" />

    <!-- Edit Spell Modal -->
    <EditSpellModal
      v-model="showEditSpellModal"
      :spell="selectedSpell"
      v-if="selectedSpell"
    />
  </ViewLayout>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSkillsStore } from '@/store/skills'
import { useSpellsStore } from '@/store/spells'
import { useToast } from '@/composables/useToast'
import type { Spell } from '../types/store/spells'
import {
  NInput,
  NButton,
  NCard,
  NEmpty
} from 'naive-ui'
import ViewLayout from '@/components/shared/ViewLayout.vue'
import ViewHeader from '@/components/shared/ViewHeader.vue'
import AddSpellModal from '@/components/spells/AddSpellModal.vue'
import EditSpellModal from '@/components/spells/EditSpellModal.vue'

const skillsStore = useSkillsStore()
const spellsStore = useSpellsStore()
const toast = useToast()
const { skills } = storeToRefs(skillsStore)
const { spells } = storeToRefs(spellsStore)

const searchQuery = ref('')
const isLoading = ref(false)
const newSkillName = ref('')
const showAddSpellModal = ref(false)
const showEditSpellModal = ref(false)
const selectedSpell = ref<Spell | null>(null)

const filteredSkills = computed(() => {
  if (!skills.value || !Array.isArray(skills.value)) return []

  let filtered = skills.value

  if (searchQuery.value) {
    filtered = filtered.filter(skill =>
      skill?.name?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

const filteredSpells = computed(() => {
  if (!spells.value || !Array.isArray(spells.value)) return []

  let filtered = spells.value

  if (searchQuery.value) {
    filtered = filtered.filter(spell =>
      spell?.name?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

onMounted(async () => {
  isLoading.value = true
  try {
    await Promise.all([
      skillsStore.getSkills(),
      spellsStore.getSpells()
    ])
  } catch (error) {
    console.error('Failed to load spells and skills:', error)
    toast.error('Failed to load spells and skills. Please refresh the page.')
  } finally {
    isLoading.value = false
  }
})

const addSkill = async () => {
  if (!newSkillName.value.trim()) return

  try {
    await skillsStore.createSkill({ name: newSkillName.value.trim() })
    toast.success('Skill added successfully!')
    newSkillName.value = ''
  } catch (error) {
    console.error('Error adding skill:', error)
    toast.error('Failed to add skill. Please try again.')
  }
}

const deleteSkill = async (id: number) => {
  try {
    await skillsStore.deleteSkill(id)
    toast.success('Skill removed successfully!')
  } catch (error) {
    console.error('Error deleting skill:', error)
    toast.error('Failed to remove skill. Please try again.')
  }
}

const editSpell = (spell: Spell) => {
  selectedSpell.value = spell
  showEditSpellModal.value = true
}

const deleteSpell = async (id: number) => {
  try {
    await spellsStore.deleteSpell(id)
    toast.success('Spell removed successfully!')
  } catch (error) {
    console.error('Error deleting spell:', error)
    toast.error('Failed to remove spell. Please try again.')
  }
}
</script>

<style scoped>
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  padding: 20px 0;
}

.section {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #ffffff;
  border-bottom: 2px solid #404040;
  padding-bottom: 8px;
}

.add-section {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
}

.skills-list, .spells-list {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}

.skill-item, .spell-item {
  transition: all 0.2s ease;
}

.skill-item:hover, .spell-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.skill-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-name {
  font-size: 16px;
  font-weight: 500;
}

.spell-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spell-name {
  font-size: 18px;
  font-weight: 600;
}

.learned-badge {
  background: #18a058;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.spell-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.spell-stars {
  display: flex;
  justify-content: center;
}

.stars-container {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 20px;
  transition: all 0.2s ease;
}

.star.filled {
  color: #f59e0b;
}

.star.empty {
  color: #e0e0e0;
}

.spell-controls {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.loading-indicator {
  text-align: center;
  padding: 40px;
  color: #888;
}

/* Responsive design for smaller screens */
@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>
