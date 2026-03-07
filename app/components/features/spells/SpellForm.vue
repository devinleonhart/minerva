<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Spell } from '@/types/store/spells'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  spell?: Spell | null
}

const props = withDefaults(defineProps<Props>(), {
  spell: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  create: [data: { name: string; neededStars: number }]
  update: [id: number, data: { name: string; neededStars: number }]
}>()

const name = ref('')
const neededStars = ref(5)

const isEditing = computed(() => !!props.spell)
const title = computed(() => isEditing.value ? 'Edit Spell' : 'Add New Spell')

watch(() => props.open, (open) => {
  if (open && props.spell) {
    name.value = props.spell.name
    neededStars.value = props.spell.neededStars
  } else if (open) {
    name.value = ''
    neededStars.value = 5
  }
})

function handleSubmit() {
  if (!name.value.trim()) return

  const data = { name: name.value.trim(), neededStars: neededStars.value }
  if (isEditing.value && props.spell) {
    emit('update', props.spell.id, data)
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

        <form class="form" @submit.prevent="handleSubmit">
          <div class="field">
            <Label for="name">Spell Name</Label>
            <Input
              id="name"
              v-model="name"
              placeholder="Enter spell name"
            />
          </div>

          <div class="field">
            <Label for="neededStars">Stars Needed</Label>
            <Input
              id="neededStars"
              v-model.number="neededStars"
              type="number"
              min="1"
              max="10"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="emit('update:open', false)">
              Cancel
            </Button>
            <Button type="submit" :disabled="!name.trim()">
              {{ isEditing ? 'Save Changes' : 'Add Spell' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </template>
  </Dialog>
</template>
