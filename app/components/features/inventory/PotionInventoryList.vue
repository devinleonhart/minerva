<script setup lang="ts">
import type { PotionInventoryItem } from '@/types/store/inventory'
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
  items: PotionInventoryItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  updateQuantity: [id: number, quantity: number]
  delete: [id: number]
}>()

function getDisplayName(item: PotionInventoryItem): string {
  if (item.potion?.cauldronName) return item.potion.cauldronName
  const recipe = item.potion?.recipe
  if (!recipe) return 'Unknown Potion'
  return recipe.name || 'Unknown Potion'
}
</script>

<template>
  <Table>
    <TableBody>
      <TableRow v-for="item in items" :key="item.id">
        <TableCell class="cell-expand">
          <div class="info-cell">
            <span class="name">{{ getDisplayName(item) }}</span>
            <span v-if="item.potion.recipe?.description" class="sub">{{ item.potion.recipe.description }}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary">{{ item.potion.quality }}</Badge>
        </TableCell>
        <TableCell>
          <div class="qty-ctrl">
            <Button
              variant="outline"
              size="icon"
              :disabled="item.quantity <= 1"
              @click="emit('updateQuantity', item.id, item.quantity - 1)"
            >
              <Minus />
            </Button>
            <span class="qty">{{ item.quantity }}</span>
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

<style scoped>
.cell-expand {
  width: 100%;
}
</style>
