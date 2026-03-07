<script setup lang="ts">
import type { Ingredient, IngredientDeletability } from '@/types/store/ingredient'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@/components/ui/table'
import { Pencil, Trash2, Shield, Plus } from 'lucide-vue-next'

interface Props {
  ingredients: Ingredient[]
  deletability: Record<number, IngredientDeletability>
}

defineProps<Props>()

const emit = defineEmits<{
  edit: [ingredient: Ingredient]
  delete: [id: number]
  toggleSecured: [id: number, secured: boolean]
  addToInventory: [ingredientId: number, quality: 'HQ' | 'NORMAL' | 'LQ']
}>()
</script>

<template>
  <Table>
    <TableBody>
      <TableRow v-for="ingredient in ingredients" :key="ingredient.id">
        <TableCell>
          <button
            @click="emit('toggleSecured', ingredient.id, !ingredient.secured)"
            :title="ingredient.secured ? 'Unsecure' : 'Secure'"
          >
            <Shield />
          </button>
        </TableCell>
        <TableCell>
          <div>
            <span>{{ ingredient.name }}</span>
            <span v-if="ingredient.description">{{ ingredient.description }}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge :variant="ingredient.secured ? 'default' : 'secondary'">
            {{ ingredient.secured ? 'Secured' : 'Unsecured' }}
          </Badge>
        </TableCell>
        <TableCell>
          <div>
            <Button
              variant="outline"
              size="sm"
              @click="emit('addToInventory', ingredient.id, 'HQ')"
            >
              <Plus />
              HQ
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="emit('addToInventory', ingredient.id, 'NORMAL')"
            >
              <Plus />
              NQ
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="emit('addToInventory', ingredient.id, 'LQ')"
            >
              <Plus />
              LQ
            </Button>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <Button
              variant="ghost"
              size="icon"
              @click="emit('edit', ingredient)"
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              :disabled="!deletability[ingredient.id]?.canDelete"
              :title="deletability[ingredient.id]?.reason || undefined"
              @click="emit('delete', ingredient.id)"
            >
              <Trash2 />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
