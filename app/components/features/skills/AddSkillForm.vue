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
  <form class="add-skill-form" @submit.prevent="handleSubmit">
    <Input
      v-model="skillName"
      placeholder="Enter skill name (e.g., Rapid Brewing)"
      @keyup.enter="handleSubmit"
    />
    <Button type="submit" :disabled="!skillName.trim()">
      <Plus />
      Add Skill
    </Button>
  </form>
</template>

<style scoped>
.add-skill-form {
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
}
</style>
