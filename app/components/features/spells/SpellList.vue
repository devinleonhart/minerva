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
          <div class="flex flex-col gap-1">
            <span class="font-medium">{{ spell.name }}</span>
            <div v-if="!spell.isLearned" class="flex items-center gap-1">
              <Star
                v-for="i in spell.neededStars"
                :key="i"
                class="h-4 w-4"
                :class="i <= spell.currentStars ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'"
              />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge :variant="spell.isLearned ? 'default' : 'secondary'">
            {{ spell.isLearned ? 'Learned' : `${spell.currentStars}/${spell.neededStars}` }}
          </Badge>
        </TableCell>
        <TableCell class="w-[100px] text-right">
          <div class="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              @click="emit('edit', spell)"
            >
              <Pencil class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              @click="emit('delete', spell.id)"
            >
              <Trash2 class="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
