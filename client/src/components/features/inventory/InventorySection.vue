<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  title: string
  empty?: boolean
  emptyMessage?: string
}

withDefaults(defineProps<Props>(), {
  empty: false,
  emptyMessage: 'No items'
})
</script>

<template>
  <Card class="mt-6">
    <CardHeader class="pb-3">
      <CardTitle class="text-lg">{{ title }}</CardTitle>
    </CardHeader>
    <CardContent class="p-0">
      <div v-if="empty" class="py-8 text-center text-muted-foreground">
        {{ emptyMessage }}
      </div>
      <slot v-else />
    </CardContent>
  </Card>
</template>
