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
import { Plus, X } from 'lucide-vue-next'

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
const notableEvents = ref<string[]>([])
const newEvent = ref('')
const url = ref('')

const isEditing = computed(() => !!props.person)
const title = computed(() => isEditing.value ? 'Edit Person' : 'Add New Person')

watch(() => props.open, (open) => {
  if (open && props.person) {
    name.value = props.person.name
    relationship.value = props.person.relationship || ''
    description.value = props.person.description || ''
    notableEvents.value = props.person.notableEvents.map(e => e.description)
    url.value = props.person.url || ''
  } else if (open) {
    name.value = ''
    relationship.value = ''
    description.value = ''
    notableEvents.value = []
    url.value = ''
  }
  newEvent.value = ''
})

function addEvent() {
  const trimmed = newEvent.value.trim()
  if (!trimmed) return
  notableEvents.value = [...notableEvents.value, trimmed]
  newEvent.value = ''
}

function removeEvent(index: number) {
  notableEvents.value = notableEvents.value.filter((_, i) => i !== index)
}

function handleNewEventKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    addEvent()
  }
}

function handleSubmit() {
  if (!name.value.trim()) return

  const data = {
    name: name.value.trim(),
    relationship: relationship.value.trim() || null,
    description: description.value.trim() || null,
    notableEvents: notableEvents.value,
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
            <div class="section-header">
              <Label>Notable Events</Label>
              <Button
                type="button"
                variant="outline"
                :disabled="!newEvent.trim()"
                @click="addEvent"
              >
                <Plus />
                Add Event
              </Button>
            </div>

            <div class="event-input-row">
              <Input
                v-model="newEvent"
                placeholder="Describe a notable event..."
                @keydown="handleNewEventKeydown"
              />
            </div>

            <div v-if="notableEvents.length === 0" class="empty-state">
              No notable events recorded.
            </div>
            <ul v-else class="event-list">
              <li v-for="(event, index) in notableEvents" :key="index" class="event-item">
                <span class="event-text">{{ event }}</span>
                <button class="remove-btn" type="button" @click="removeEvent(index)">
                  <X />
                </button>
              </li>
            </ul>
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

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.375rem;
}

.event-input-row {
  margin-bottom: 0.5rem;
}

.event-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.event-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem 0.375rem 0.75rem;
  background-color: var(--color-accent);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.event-text {
  flex: 1;
  min-width: 0;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.1875rem;
  border-radius: var(--radius-sm);
  color: var(--color-muted-foreground);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.1s, background-color 0.1s;
}

.remove-btn:hover {
  color: var(--color-destructive);
  background-color: color-mix(in srgb, var(--color-destructive) 12%, transparent);
}
</style>
