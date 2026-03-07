<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AddCurrencyRequest } from '@/types/store/inventory'
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
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [data: AddCurrencyRequest]
}>()

const name = ref('')
const value = ref(0)

watch(() => props.open, (open) => {
  if (open) {
    name.value = ''
    value.value = 0
  }
})

function handleSubmit() {
  if (!name.value.trim()) return

  emit('submit', {
    name: name.value.trim(),
    value: value.value
  })

  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Currency</DialogTitle>
        </DialogHeader>

        <form @submit.prevent="handleSubmit">
          <div>
            <Label for="name">Currency Name</Label>
            <Input
              id="name"
              v-model="name"
              placeholder="e.g., Gold, Silver, Gems"
            />
          </div>

          <div>
            <Label for="value">Initial Value</Label>
            <Input
              id="value"
              v-model.number="value"
              type="number"
              min="0"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" @click="emit('update:open', false)">
              Cancel
            </Button>
            <Button type="submit" :disabled="!name.trim()">
              Add Currency
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </template>
  </Dialog>
</template>
