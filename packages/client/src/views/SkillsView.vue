<template>
  <ViewLayout>
    <ViewHeader
      :show-search="true"
      search-placeholder="Search skills..."
      :search-value="searchQuery"
      @update:search-value="searchQuery = $event"
    >
      <template #right>
        <div class="add-skill">
          <n-input
            v-model:value="newSkillName"
            placeholder="Enter skill name (e.g., Rapid Brewing)"
            size="large"
            @keyup.enter="addSkill"
          />
          <n-button type="primary" size="large" :disabled="!newSkillName.trim()" @click="addSkill">
            Add Skill
          </n-button>
        </div>
      </template>
    </ViewHeader>

    <div v-if="isLoading" class="loading-indicator">
      Loading skills...
    </div>

    <n-empty
      v-else-if="filteredSkills.length === 0"
      :description="searchQuery ? `No skills match '${searchQuery}'` : 'No skills yet. Add your first skill!'"
    />

    <ResourceList v-else>
      <ResourceRow
        v-for="skill in filteredSkills"
        :key="skill.id"
        :title="skill.name"
      >
        <template #actions>
          <n-button type="error" size="small" ghost @click="deleteSkill(skill.id)">
            Delete
          </n-button>
        </template>
      </ResourceRow>
    </ResourceList>
  </ViewLayout>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSkillsStore } from '@/store/skills'
import {
  NInput,
  NButton,
  NEmpty
} from 'naive-ui'
import ViewLayout from '@/components/shared/ViewLayout.vue'
import ViewHeader from '@/components/shared/ViewHeader.vue'
import ResourceList from '@/components/shared/ResourceList.vue'
import ResourceRow from '@/components/shared/ResourceRow.vue'

const skillsStore = useSkillsStore()
const { skills } = storeToRefs(skillsStore)

const searchQuery = ref('')
const newSkillName = ref('')
const isLoading = ref(false)

const filteredSkills = computed(() => {
  let list = skills.value ?? []
  if (searchQuery.value) {
    const term = searchQuery.value.toLowerCase()
    list = list.filter((skill) =>
      skill.name.toLowerCase().includes(term)
    )
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
})

onMounted(async () => {
  isLoading.value = true
  try {
    await skillsStore.getSkills()
  } catch (error) {
    console.error('Failed to load skills. Please refresh.', error)
  } finally {
    isLoading.value = false
  }
})

const addSkill = async () => {
  if (!newSkillName.value.trim()) return
  try {
    await skillsStore.createSkill({ name: newSkillName.value.trim() })
    console.log('Skill added successfully!')
    newSkillName.value = ''
  } catch (error) {
    console.error('Failed to add skill. Please try again.', error)
  }
}

const deleteSkill = async (id: number) => {
  try {
    await skillsStore.deleteSkill(id)
    console.log('Skill removed successfully!')
  } catch (error) {
    console.error('Failed to remove skill. Please try again.', error)
  }
}
</script>

<style scoped>
.add-skill {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  max-width: 520px;
}

.loading-indicator {
  text-align: center;
  padding: 40px;
  color: #888;
}

@media (max-width: 768px) {
  .add-skill {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
