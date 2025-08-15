import { useNotification } from 'naive-ui'

import type { ToastOptions } from '@/types/composables'

export function useToast() {
  const notification = useNotification()

  if (!notification) {
    console.warn('useToast: No notification provider found')
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {}
    }
  }

  const success = (message: string, options: ToastOptions = {}) => {
    notification.success({
      title: options.title || 'Success',
      content: message,
      duration: options.duration || 3000,
      keepAliveOnHover: options.keepAliveOnHover || true
    })
  }

  const error = (message: string, options: ToastOptions = {}) => {
    notification.error({
      title: options.title || 'Error',
      content: message,
      duration: options.duration || 5000,
      keepAliveOnHover: options.keepAliveOnHover || true
    })
  }

  const warning = (message: string, options: ToastOptions = {}) => {
    notification.warning({
      title: options.title || 'Warning',
      content: message,
      duration: options.duration || 4000,
      keepAliveOnHover: options.keepAliveOnHover || true
    })
  }

  const info = (message: string, options: ToastOptions = {}) => {
    notification.info({
      title: options.title || 'Info',
      content: message,
      duration: options.duration || 3000,
      keepAliveOnHover: options.keepAliveOnHover || true
    })
  }

  return {
    success,
    error,
    warning,
    info
  }
}
