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
        <TableCell class="w-[40px]">
          <button
            class="focus:outline-none transition-transform hover:scale-110"
            @click="emit('toggleSecured', ingredient.id, !ingredient.secured)"
            :title="ingredient.secured ? 'Unsecure' : 'Secure'"
          >
            <Shield
              class="h-5 w-5"
              :class="ingredient.secured ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'"
            />
          </button>
        </TableCell>
        <TableCell>
          <div class="flex flex-col gap-1">
            <span class="font-medium">{{ ingredient.name }}</span>
            <span v-if="ingredient.description" class="text-xs text-muted-foreground truncate max-w-[200px]">
              {{ ingredient.description }}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge :variant="ingredient.secured ? 'default' : 'secondary'">
            {{ ingredient.secured ? 'Secured' : 'Unsecured' }}
          </Badge>
        </TableCell>
        <TableCell>
          <div class="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              class="text-green-500 border-green-500/50 hover:bg-green-500/10"
              @click="emit('addToInventory', ingredient.id, 'HQ')"
            >
              <Plus class="h-3 w-3 mr-1" />
              HQ
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="text-blue-500 border-blue-500/50 hover:bg-blue-500/10"
              @click="emit('addToInventory', ingredient.id, 'NORMAL')"
            >
              <Plus class="h-3 w-3 mr-1" />
              NQ
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="text-amber-500 border-amber-500/50 hover:bg-amber-500/10"
              @click="emit('addToInventory', ingredient.id, 'LQ')"
            >
              <Plus class="h-3 w-3 mr-1" />
              LQ
            </Button>
          </div>
        </TableCell>
        <TableCell class="w-[100px] text-right">
          <div class="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              @click="emit('edit', ingredient)"
            >
              <Pencil class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              :disabled="!deletability[ingredient.id]?.canDelete"
              :title="deletability[ingredient.id]?.reason || undefined"
              @click="emit('delete', ingredient.id)"
            >
              <Trash2 class="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
