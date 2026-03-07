<script setup lang="ts">
import type { Currency } from '@/types/store/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@/components/ui/table'
import { Trash2 } from 'lucide-vue-next'

interface Props {
  currencies: Currency[]
}

defineProps<Props>()

const emit = defineEmits<{
  updateValue: [id: number, value: number]
  delete: [id: number]
}>()

function handleValueChange(id: number, event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value, 10)
  if (!isNaN(value) && value >= 0) {
    emit('updateValue', id, value)
  }
}
</script>

<template>
  <Table>
    <TableBody>
      <TableRow v-for="currency in currencies" :key="currency.id">
        <TableCell class="cell-expand">
          <span>{{ currency.name }}</span>
        </TableCell>
        <TableCell>
          <Input
            type="number"
            :model-value="String(currency.value)"
            min="0"
            @change="handleValueChange(currency.id, $event)"
          />
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            @click="emit('delete', currency.id)"
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
