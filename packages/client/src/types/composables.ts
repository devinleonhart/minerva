export interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  duration?: number
  closable?: boolean
  keepAliveOnHover?: boolean
}

export interface Toast {
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  warning: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
}
