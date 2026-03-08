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
            <a v-if="person.url" class="name name-link" :href="person.url" target="_blank" rel="noopener noreferrer">{{ person.name }}</a>
            <span v-else class="name">{{ person.name }}</span>
            <span v-if="person.relationship" class="sub">{{ person.relationship }}</span>
          </div>
        </TableCell>
        <TableCell>
          <div class="info-cell">
            <span v-if="person.description" class="sub">{{ person.description }}</span>
            <ul v-if="person.notableEvents.length > 0" class="events-list">
              <li v-for="event in person.notableEvents" :key="event.id">{{ event.description }}</li>
            </ul>
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

<style scoped>
.events-list {
  margin: 0.25rem 0 0 1rem;
  padding: 0;
  font-size: 0.8125rem;
  color: var(--color-muted-foreground);
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.name-link {
  color: var(--color-foreground);
  text-decoration: none;
}

.name-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
}
</style>
