<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSkillsStore } from '@/store/skills'
import { useToast, useConfirm, useSearch } from '@/composables'
import { PageLayout } from '@/components/layout'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { SkillList, AddSkillForm } from '@/components/features/skills'
import { Search, Loader2 } from 'lucide-vue-next'

const skillsStore = useSkillsStore()
const { skills } = storeToRefs(skillsStore)
const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)

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
      <div class="relative w-64">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search skills..."
          class="pl-9"
        />
      </div>
    </template>

    <Card>
      <CardContent class="pt-6">
        <AddSkillForm @submit="handleAddSkill" />
      </CardContent>
    </Card>

    <Card class="mt-6">
      <CardContent class="p-0">
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>

        <div v-else-if="sortedSkills.length === 0" class="py-12 text-center text-muted-foreground">
          {{ searchQuery ? `No skills match "${searchQuery}"` : 'No skills yet. Add your first skill!' }}
        </div>

        <SkillList
          v-else
          :skills="sortedSkills"
          @delete="handleDeleteSkill"
        />
      </CardContent>
    </Card>
  </PageLayout>
</template>
