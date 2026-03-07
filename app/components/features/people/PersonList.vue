<script setup lang="ts">
import type { Person } from '@/types/store/people'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@/components/ui/table'
import { Pencil, Trash2, Star } from 'lucide-vue-next'

interface Props {
  people: Person[]
}

defineProps<Props>()

const emit = defineEmits<{
  edit: [person: Person]
  delete: [id: number]
  toggleFavorite: [id: number, isFavorited: boolean]
}>()
</script>

<template>
  <Table>
    <TableBody>
      <TableRow v-for="person in people" :key="person.id">
        <TableCell>
          <button
            class="icon-btn"
            :class="{ active: person.isFavorited }"
            @click="emit('toggleFavorite', person.id, !person.isFavorited)"
            :title="person.isFavorited ? 'Unfavorite' : 'Favorite'"
          >
            <Star />
          </button>
        </TableCell>
        <TableCell>
          <div class="info-cell">
            <span class="name">{{ person.name }}</span>
            <span v-if="person.relationship" class="sub">{{ person.relationship }}</span>
          </div>
        </TableCell>
        <TableCell>
          <div class="info-cell">
            <span v-if="person.description" class="sub" :title="person.description">{{ person.description }}</span>
            <span v-if="person.notableEvents" class="sub" :title="person.notableEvents">{{ person.notableEvents }}</span>
          </div>
        </TableCell>
        <TableCell>
          <div class="actions">
            <Button
              variant="ghost"
              size="icon"
              @click="emit('edit', person)"
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              @click="emit('delete', person.id)"
            >
              <Trash2 />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
