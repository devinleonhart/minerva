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
  const recipe = item.potion?.recipe
  if (!recipe) return 'Unknown Potion'
  return recipe.cauldronName || recipe.name || 'Unknown Potion'
}
</script>

<template>
  <Table>
    <TableBody>
      <TableRow v-for="item in items" :key="item.id">
        <TableCell>
          <div class="flex flex-col gap-1">
            <span class="font-medium">{{ getDisplayName(item) }}</span>
            <span v-if="item.potion.recipe?.description" class="text-xs text-muted-foreground truncate max-w-[200px]">
              {{ item.potion.recipe.description }}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary">
            {{ item.potion.quality }}
          </Badge>
        </TableCell>
        <TableCell>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              class="h-8 w-8"
              :disabled="item.quantity <= 1"
              @click="emit('updateQuantity', item.id, item.quantity - 1)"
            >
              <Minus class="h-3 w-3" />
            </Button>
            <span class="w-8 text-center font-medium">{{ item.quantity }}</span>
            <Button
              variant="outline"
              size="icon"
              class="h-8 w-8"
              @click="emit('updateQuantity', item.id, item.quantity + 1)"
            >
              <Plus class="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
        <TableCell class="w-[60px] text-right">
          <Button
            variant="ghost"
            size="icon"
            @click="emit('delete', item.id)"
          >
            <Trash2 class="h-4 w-4 text-destructive" />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
