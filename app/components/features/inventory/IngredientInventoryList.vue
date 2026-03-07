<script setup lang="ts">
import type { InventoryItem } from '@/types/store/inventory'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@/components/ui/table'
import { Minus, Plus, Trash2 } from 'lucide-vue-next'

interface Props {
  items: InventoryItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  updateQuantity: [id: number, quality: string, quantity: number]
  delete: [id: number]
}>()

function getQualityVariant(quality: string): 'default' | 'secondary' | 'destructive' {
  switch (quality) {
    case 'HQ': return 'default'
    case 'LQ': return 'destructive'
    default: return 'secondary'
  }
}
</script>

<template>
  <Table>
    <TableBody>
      <TableRow v-for="item in items" :key="item.id">
        <TableCell>
          <div class="info-cell">
            <span class="name">{{ item.ingredient.name }}</span>
            <span v-if="item.ingredient.description" class="sub">{{ item.ingredient.description }}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge :variant="getQualityVariant(item.quality)">
            {{ item.quality }}
          </Badge>
        </TableCell>
        <TableCell>
          <div class="qty-ctrl">
            <Button
              variant="outline"
              size="icon"
              :disabled="item.quantity <= 1"
              @click="emit('updateQuantity', item.id, item.quality, item.quantity - 1)"
            >
              <Minus />
            </Button>
            <span class="qty">{{ item.quantity }}</span>
            <Button
              variant="outline"
              size="icon"
              @click="emit('updateQuantity', item.id, item.quality, item.quantity + 1)"
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
