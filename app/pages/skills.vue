<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { PageLayout } from '@/components/layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SkillList, SkillForm } from '@/components/features/skills'
import { Search, Loader2, Plus } from 'lucide-vue-next'

const skillsStore = useSkillsStore()
const { skills } = storeToRefs(skillsStore)
const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const showForm = ref(false)

const { searchQuery, filteredItems } = useSearch({
  items: skills,
  searchFields: ['name']
})

const sortedSkills = computed(() =>
  [...filteredItems.value].sort((a, b) => a.name.localeCompare(b.name))
)

onMounted(async () => {
  isLoading.value = true
  try {
    await skillsStore.getSkills()
  } catch {
    toast.error('Failed to load skills')
  } finally {
    isLoading.value = false
  }
})

async function handleAddSkill(name: string) {
  try {
    await skillsStore.createSkill({ name })
    toast.success('Skill added successfully')
  } catch {
    toast.error('Failed to add skill')
  }
}

async function handleDeleteSkill(id: number) {
  const confirmed = await confirm.confirm({
    title: 'Delete Skill',
    message: 'Are you sure you want to delete this skill?',
    confirmText: 'Delete',
    variant: 'destructive'
  })

  if (!confirmed) return

  try {
    await skillsStore.deleteSkill(id)
    toast.success('Skill deleted successfully')
  } catch {
    toast.error('Failed to delete skill')
  }
}
</script>

<template>
  <PageLayout title="Skills" description="This should do the trick!">
    <template #actions>
      <div class="action-bar">
        <div class="search-group">
          <Search />
          <Input
            v-model="searchQuery"
            placeholder="Search skills..."
          />
        </div>
        <Button @click="showForm = true">
          <Plus />
          Add Skill
        </Button>
      </div>
    </template>

    <div v-if="isLoading" class="loading-center">
      <Loader2 />
    </div>

    <div v-else-if="sortedSkills.length === 0" class="empty-state">
      {{ searchQuery ? `No skills match "${searchQuery}"` : 'No skills yet. Add your first skill!' }}
    </div>

    <SkillList
      v-else
      :skills="sortedSkills"
      @delete="handleDeleteSkill"
    />

    <SkillForm
      :open="showForm"
      @update:open="showForm = $event"
      @create="handleAddSkill"
    />
  </PageLayout>
</template>
