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
  <Card>
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="empty">{{ emptyMessage }}</div>
      <slot v-else />
    </CardContent>
  </Card>
</template>
