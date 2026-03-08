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
  submit: [id: number, quantity: number]
}>()

const quantity = ref(1)

watch(() => props.open, (open) => {
  if (open && props.item) {
    quantity.value = props.item.quantity
  }
})

function handleSubmit() {
  if (!props.item) return
  emit('submit', props.item.id, quantity.value)
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
          <div v-if="item" class="item-name">{{ item.item.name }}</div>

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
            <Button type="submit" :disabled="quantity < 1">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </template>
  </Dialog>
</template>

<style scoped>
.item-name {
  font-weight: 600;
  font-size: 0.9375rem;
  margin-bottom: 0.25rem;
}
</style>
