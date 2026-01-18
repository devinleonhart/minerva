import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

const isOpen = ref(false)
const options = ref<ConfirmOptions | null>(null)
let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirm() {
  function confirm(opts: ConfirmOptions): Promise<boolean> {
    options.value = {
      title: opts.title || 'Confirm',
      message: opts.message,
      confirmText: opts.confirmText || 'Confirm',
      cancelText: opts.cancelText || 'Cancel',
      variant: opts.variant || 'default'
    }
    isOpen.value = true

    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function handleConfirm() {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
  }

  function handleCancel() {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
  }

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel
  }
}
