<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Ingredient, IngredientForm as IIngredientForm } from '@/types/store/ingredient'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  ingredient?: Ingredient | null
}

const props = withDefaults(defineProps<Props>(), {
  ingredient: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  create: [data: IIngredientForm]
  update: [id: number, data: IIngredientForm]
}>()

const name = ref('')
const description = ref('')

const isEditing = computed(() => !!props.ingredient)
const title = computed(() => isEditing.value ? 'Edit Ingredient' : 'Add New Ingredient')

watch(() => props.open, (open) => {
  if (open && props.ingredient) {
    name.value = props.ingredient.name
    description.value = props.ingredient.description
  } else if (open) {
    name.value = ''
    description.value = ''
  }
})

function handleSubmit() {
  if (!name.value.trim()) return

  const data = {
    name: name.value.trim(),
    description: description.value.trim()
  }

  if (isEditing.value && props.ingredient) {
    emit('update', props.ingredient.id, data)
  } else {
    emit('create', data)
  }

  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ title }}</DialogTitle>
        </DialogHeader>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input
              id="name"
              v-model="name"
              placeholder="Enter ingredient name"
            />
          </div>

          <div class="space-y-2">
            <Label for="description">Description</Label>
            <Textarea
              id="description"
              v-model="description"
              placeholder="Brief description..."
              :rows="3"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="emit('update:open', false)">
              Cancel
            </Button>
            <Button type="submit" :disabled="!name.trim()">
              {{ isEditing ? 'Save Changes' : 'Add Ingredient' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </template>
  </Dialog>
</template>
