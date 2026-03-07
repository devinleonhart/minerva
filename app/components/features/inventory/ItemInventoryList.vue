<script setup lang="ts">
import type { ItemInventoryItem } from '@/types/store/inventory'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@/components/ui/table'
import { Minus, Plus, Trash2 } from 'lucide-vue-next'

interface Props {
  items: ItemInventoryItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  updateQuantity: [id: number, quantity: number]
  delete: [id: number]
}>()
</script>

<template>
  <Table>
    <TableBody>
      <TableRow v-for="item in items" :key="item.id">
        <TableCell>
          <div>
            <span>{{ item.item.name }}</span>
            <span v-if="item.item.description">{{ item.item.description }}</span>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <Button
              variant="outline"
              size="icon"
              :disabled="item.quantity <= 1"
              @click="emit('updateQuantity', item.id, item.quantity - 1)"
            >
              <Minus />
            </Button>
            <span>{{ item.quantity }}</span>
            <Button
              variant="outline"
              size="icon"
              @click="emit('updateQuantity', item.id, item.quantity + 1)"
            >
              <Plus />
            </Button>
          </div>
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            @click="emit('delete', item.id)"
          >
            <Trash2 />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
