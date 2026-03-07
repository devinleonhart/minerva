<script setup lang="ts">
import { ref, watch } from 'vue'
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
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [data: { name: string; description: string; quantity: number }]
}>()

const name = ref('')
const description = ref('')
const quantity = ref(1)

watch(() => props.open, (open) => {
  if (open) {
    name.value = ''
    description.value = ''
    quantity.value = 1
  }
})

function handleSubmit() {
  if (!name.value.trim()) return

  emit('submit', {
    name: name.value.trim(),
    description: description.value.trim(),
    quantity: quantity.value
  })

  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>

        <form class="form" @submit.prevent="handleSubmit">
          <div class="field">
            <Label for="name">Item Name</Label>
            <Input
              id="name"
              v-model="name"
              placeholder="Enter item name"
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
            <Label for="quantity">Quantity</Label>
            <Input
              id="quantity"
              v-model.number="quantity"
              type="number"
              min="1"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="emit('update:open', false)">
              Cancel
            </Button>
            <Button type="submit" :disabled="!name.trim()">
              Add Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </template>
  </Dialog>
</template>
