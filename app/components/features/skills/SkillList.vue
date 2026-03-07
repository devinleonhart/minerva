<script setup lang="ts">
import type { Skill } from '@/types/store/skills'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@/components/ui/table'
import { Trash2 } from 'lucide-vue-next'

interface Props {
  skills: Skill[]
}

defineProps<Props>()

const emit = defineEmits<{
  delete: [id: number]
}>()
</script>

<template>
  <Table>
    <TableBody>
      <TableRow v-for="skill in skills" :key="skill.id">
        <TableCell>{{ skill.name }}</TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            @click="emit('delete', skill.id)"
          >
            <Trash2 />
          </Button>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
