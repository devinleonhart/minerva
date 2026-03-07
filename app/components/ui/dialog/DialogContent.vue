<script setup lang="ts">
import { DialogContent, DialogClose } from 'radix-vue'
import { X } from 'lucide-vue-next'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <DialogContent :class="props.class">
    <slot />
    <DialogClose>
      <X />
      <span class="sr-only">Close</span>
    </DialogClose>
  </DialogContent>
</template>
