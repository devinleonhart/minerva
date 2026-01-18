<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const { isOpen, options, handleConfirm, handleCancel } = useConfirm()
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleCancel">
    <template #content>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ options?.title }}</DialogTitle>
          <DialogDescription>{{ options?.message }}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="handleCancel">
            {{ options?.cancelText }}
          </Button>
          <Button
            :variant="options?.variant === 'destructive' ? 'destructive' : 'default'"
            @click="handleConfirm"
          >
            {{ options?.confirmText }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </template>
  </Dialog>
</template>
