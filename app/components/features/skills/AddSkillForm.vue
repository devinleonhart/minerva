<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-vue-next'

const emit = defineEmits<{
  submit: [name: string]
}>()

const skillName = ref('')

function handleSubmit() {
  const name = skillName.value.trim()
  if (!name) return

  emit('submit', name)
  skillName.value = ''
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex gap-2">
    <Input
      v-model="skillName"
      placeholder="Enter skill name (e.g., Rapid Brewing)"
      class="flex-1"
      @keyup.enter="handleSubmit"
    />
    <Button type="submit" :disabled="!skillName.trim()">
      <Plus class="mr-2 h-4 w-4" />
      Add Skill
    </Button>
  </form>
</template>
