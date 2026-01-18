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
        <TableCell class="w-[40px]">
          <button
            class="focus:outline-none transition-transform hover:scale-110"
            @click="emit('toggleFavorite', person.id, !person.isFavorited)"
            :title="person.isFavorited ? 'Unfavorite' : 'Favorite'"
          >
            <Star
              class="h-5 w-5"
              :class="person.isFavorited ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'"
            />
          </button>
        </TableCell>
        <TableCell>
          <div class="flex flex-col gap-1">
            <span class="font-medium">{{ person.name }}</span>
            <span v-if="person.relationship" class="text-xs text-muted-foreground">
              {{ person.relationship }}
            </span>
          </div>
        </TableCell>
        <TableCell class="max-w-[300px]">
          <div class="flex flex-col gap-1 truncate">
            <span v-if="person.description" class="text-sm text-muted-foreground truncate" :title="person.description">
              {{ person.description }}
            </span>
            <span v-if="person.notableEvents" class="text-sm text-green-400 truncate" :title="person.notableEvents">
              {{ person.notableEvents }}
            </span>
          </div>
        </TableCell>
        <TableCell class="w-[100px] text-right">
          <div class="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              @click="emit('edit', person)"
            >
              <Pencil class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              @click="emit('delete', person.id)"
            >
              <Trash2 class="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
