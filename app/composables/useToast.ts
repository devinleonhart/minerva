import { ref } from 'vue'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant: 'default' | 'success' | 'destructive'
  open: boolean
}

const toasts = ref<Toast[]>([])

let toastCount = 0

function generateId() {
  return `toast-${++toastCount}`
}

export function useToast() {
  function addToast(toast: Omit<Toast, 'id' | 'open'>) {
    const id = generateId()
    toasts.value.push({
      ...toast,
      id,
      open: true
    })

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismissToast(id)
    }, 5000)

    return id
  }

  function dismissToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value[index]!.open = false
      // Remove from array after animation
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 300)
    }
  }

  function success(message: string, title?: string) {
    return addToast({
      title: title || 'Success',
      description: message,
      variant: 'success'
    })
  }

  function error(message: string, title?: string) {
    return addToast({
      title: title || 'Error',
      description: message,
      variant: 'destructive'
    })
  }

  function info(message: string, title?: string) {
    return addToast({
      title,
      description: message,
      variant: 'default'
    })
  }

  return {
    toasts,
    addToast,
    dismissToast,
    success,
    error,
    info
  }
}
