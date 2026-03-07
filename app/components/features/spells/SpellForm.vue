<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Spell, CreateSpellRequest, UpdateSpellRequest } from '@/types/store/spells'
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
  create: [data: CreateSpellRequest]
  update: [id: number, data: UpdateSpellRequest]
}>()

const name = ref('')
const neededStars = ref(5)
const currentStars = ref(0)

const isEditing = computed(() => !!props.spell)
const title = computed(() => isEditing.value ? 'Edit Spell' : 'Add New Spell')

watch(() => props.open, (open) => {
  if (open && props.spell) {
    name.value = props.spell.name
    neededStars.value = props.spell.neededStars
    currentStars.value = props.spell.currentStars
  } else if (open) {
    name.value = ''
    neededStars.value = 5
    currentStars.value = 0
  }
})

function handleSubmit() {
  if (!name.value.trim()) return

  if (isEditing.value && props.spell) {
    emit('update', props.spell.id, {
      name: name.value.trim(),
      neededStars: neededStars.value,
      currentStars: currentStars.value
    })
  } else {
    emit('create', {
      name: name.value.trim(),
      neededStars: neededStars.value,
      currentStars: currentStars.value
    })
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

        <form @submit.prevent="handleSubmit">
          <div>
            <Label for="name">Spell Name</Label>
            <Input
              id="name"
              v-model="name"
              placeholder="Enter spell name"
            />
          </div>

          <div>
            <div>
              <Label for="neededStars">Stars Needed</Label>
              <Input
                id="neededStars"
                v-model.number="neededStars"
                type="number"
                min="1"
                max="10"
              />
            </div>

            <div>
              <Label for="currentStars">Current Stars</Label>
              <Input
                id="currentStars"
                v-model.number="currentStars"
                type="number"
                min="0"
                :max="neededStars"
              />
            </div>
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
