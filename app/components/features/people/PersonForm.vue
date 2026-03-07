<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Person, CreatePersonRequest, UpdatePersonRequest } from '@/types/store/people'
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
  person?: Person | null
}

const props = withDefaults(defineProps<Props>(), {
  person: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  create: [data: CreatePersonRequest]
  update: [id: number, data: UpdatePersonRequest]
}>()

const name = ref('')
const relationship = ref('')
const description = ref('')
const notableEvents = ref('')
const url = ref('')

const isEditing = computed(() => !!props.person)
const title = computed(() => isEditing.value ? 'Edit Person' : 'Add New Person')

watch(() => props.open, (open) => {
  if (open && props.person) {
    name.value = props.person.name
    relationship.value = props.person.relationship || ''
    description.value = props.person.description || ''
    notableEvents.value = props.person.notableEvents || ''
    url.value = props.person.url || ''
  } else if (open) {
    name.value = ''
    relationship.value = ''
    description.value = ''
    notableEvents.value = ''
    url.value = ''
  }
})

function handleSubmit() {
  if (!name.value.trim()) return

  const data = {
    name: name.value.trim(),
    relationship: relationship.value.trim() || null,
    description: description.value.trim() || null,
    notableEvents: notableEvents.value.trim() || null,
    url: url.value.trim() || null
  }

  if (isEditing.value && props.person) {
    emit('update', props.person.id, data)
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
            <Label for="name">Name</Label>
            <Input
              id="name"
              v-model="name"
              placeholder="Enter person's name"
            />
          </div>

          <div class="field">
            <Label for="relationship">Relationship</Label>
            <Input
              id="relationship"
              v-model="relationship"
              placeholder="e.g., Friend, Mentor, Rival"
            />
          </div>

          <div class="field">
            <Label for="description">Description</Label>
            <Textarea
              id="description"
              v-model="description"
              placeholder="Brief description..."
              :rows="2"
            />
          </div>

          <div class="field">
            <Label for="notableEvents">Notable Events</Label>
            <Textarea
              id="notableEvents"
              v-model="notableEvents"
              placeholder="Important interactions or events..."
              :rows="2"
            />
          </div>

          <div class="field">
            <Label for="url">URL</Label>
            <Input
              id="url"
              v-model="url"
              placeholder="Optional reference link"
              type="url"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="emit('update:open', false)">
              Cancel
            </Button>
            <Button type="submit" :disabled="!name.trim()">
              {{ isEditing ? 'Save Changes' : 'Add Person' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </template>
  </Dialog>
</template>
