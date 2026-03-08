<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ItemInventoryItem } from '@/types/store/inventory'
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
  item?: ItemInventoryItem | null
}

const props = withDefaults(defineProps<Props>(), {
  item: null
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [id: number, name: string, description: string]
}>()

const name = ref('')
const description = ref('')

watch(() => props.open, (open) => {
  if (open && props.item) {
    name.value = props.item.item.name
    description.value = props.item.item.description
  }
})

function handleSubmit() {
  if (!props.item || !name.value.trim()) return
  emit('submit', props.item.item.id, name.value.trim(), description.value.trim())
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        <form class="form" @submit.prevent="handleSubmit">
          <div class="field">
            <Label for="name">Name</Label>
            <Input
              id="name"
              v-model="name"
              placeholder="Item name"
            />
          </div>

          <div class="field">
            <Label for="description">Description</Label>
            <Textarea
              id="description"
              v-model="description"
              placeholder="Item description"
              :rows="2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="emit('update:open', false)">
              Cancel
            </Button>
            <Button type="submit" :disabled="!name.trim()">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </template>
  </Dialog>
</template>
