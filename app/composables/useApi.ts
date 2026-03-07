import { ref } from 'vue'
import { api } from '@/lib/api'
import { useToast } from './useToast'
import type { AxiosRequestConfig } from 'axios'

export function useApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  async function request<T>(
    config: AxiosRequestConfig,
    options: {
      showSuccessToast?: boolean
      successMessage?: string
      showErrorToast?: boolean
    } = {}
  ): Promise<T | null> {
    const {
      showSuccessToast = false,
      successMessage = 'Operation successful',
      showErrorToast = true
    } = options

    loading.value = true
    error.value = null

    try {
      const response = await api.request<T>(config)

      if (showSuccessToast) {
        toast.success(successMessage)
      }

      return response.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      error.value = message

      if (showErrorToast) {
        toast.error(message)
      }

      return null
    } finally {
      loading.value = false
    }
  }

  async function get<T>(url: string, options?: Parameters<typeof request>[1]) {
    return request<T>({ method: 'GET', url }, options)
  }

  async function post<T>(url: string, data?: unknown, options?: Parameters<typeof request>[1]) {
    return request<T>({ method: 'POST', url, data }, options)
  }

  async function put<T>(url: string, data?: unknown, options?: Parameters<typeof request>[1]) {
    return request<T>({ method: 'PUT', url, data }, options)
  }

  async function del<T>(url: string, options?: Parameters<typeof request>[1]) {
    return request<T>({ method: 'DELETE', url }, options)
  }

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    del
  }
}
