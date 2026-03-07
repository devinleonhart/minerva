<script setup lang="ts">
import type { Spell } from '@/types/store/spells'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
}>()
</script>

<template>
  <Table>
    <TableBody>
      <TableRow v-for="spell in spells" :key="spell.id">
        <TableCell>
          <div>
            <span>{{ spell.name }}</span>
            <div v-if="!spell.isLearned">
              <Star v-for="i in spell.neededStars" :key="i" />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge :variant="spell.isLearned ? 'default' : 'secondary'">
            {{ spell.isLearned ? 'Learned' : `${spell.currentStars}/${spell.neededStars}` }}
          </Badge>
        </TableCell>
        <TableCell>
          <div>
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
