<script setup lang="ts">
import type { Spell } from '@/types/store/spells'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@/components/ui/table'
import { Pencil, Trash2, Star } from 'lucide-vue-next'

interface Props {
  spells: Spell[]
}

defineProps<Props>()

const emit = defineEmits<{
  edit: [spell: Spell]
  delete: [id: number]
  updateProgress: [id: number, currentStars: number]
}>()
</script>

<template>
  <Table>
    <TableBody>
      <TableRow v-for="spell in spells" :key="spell.id">
        <TableCell class="cell-expand">
          <div class="info-cell">
            <span class="name">{{ spell.name }}</span>
          </div>
        </TableCell>
        <TableCell>
          <div class="stars">
            <button
              v-for="i in spell.neededStars"
              :key="i"
              class="star-btn"
              :title="`Set progress to ${i}/${spell.neededStars}`"
              @click="emit('updateProgress', spell.id, i === spell.currentStars ? i - 1 : i)"
            >
              <Star :class="i <= spell.currentStars ? 'star-filled' : 'star-empty'" />
            </button>
          </div>
        </TableCell>
        <TableCell>
          <div class="actions">
            <Button
              variant="ghost"
              size="icon"
              @click="emit('edit', spell)"
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              @click="emit('delete', spell.id)"
            >
              <Trash2 />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

<style scoped>
.cell-expand {
  width: 100%;
}

.stars {
  display: flex;
  gap: 0.125rem;
  font-size: 0.75rem;
}

.star-btn {
  background: none;
  border: none;
  padding: 0.125rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: var(--radius-sm);
  transition: background-color 0.1s;
}

.star-btn:hover {
  background-color: var(--color-accent);
}

.star-filled {
  color: #f59e0b;
}

.star-empty {
  color: var(--color-border);
}
</style>
