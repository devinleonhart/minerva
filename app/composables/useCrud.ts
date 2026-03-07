import { ref, computed } from 'vue'
import { useApi } from './useApi'

export interface CrudOptions<T> {
  endpoint: string
  idKey?: keyof T
  entityName?: string
}

export function useCrud<T extends { id?: number }>(options: CrudOptions<T>) {
  const { endpoint, idKey = 'id' as keyof T, entityName = 'Item' } = options

  const items = ref<T[]>([]) as { value: T[] }
  const selectedItem = ref<T | null>(null) as { value: T | null }
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const api = useApi()

  // Computed for easy access
  const isEmpty = computed(() => items.value.length === 0)
  const count = computed(() => items.value.length)

  async function fetchAll() {
    isLoading.value = true
    error.value = null

    const result = await api.get<T[]>(endpoint, { showErrorToast: true })
    if (result) {
      items.value = result
    }

    isLoading.value = false
    return result
  }

  async function fetchOne(id: number) {
    isLoading.value = true
    error.value = null

    const result = await api.get<T>(`${endpoint}/${id}`, { showErrorToast: true })
    if (result) {
      selectedItem.value = result
    }

    isLoading.value = false
    return result
  }

  async function create(data: Partial<T>) {
    const result = await api.post<T>(endpoint, data, {
      showSuccessToast: true,
      successMessage: `${entityName} created successfully`
    })

    if (result) {
      items.value.push(result)
    }

    return result
  }

  async function update(id: number, data: Partial<T>) {
    const result = await api.put<T>(`${endpoint}/${id}`, data, {
      showSuccessToast: true,
      successMessage: `${entityName} updated successfully`
    })

    if (result) {
      const index = items.value.findIndex(item => item[idKey] === id)
      if (index > -1) {
        items.value[index] = result
      }
    }

    return result
  }

  async function remove(id: number) {
    const result = await api.del(`${endpoint}/${id}`, {
      showSuccessToast: true,
      successMessage: `${entityName} deleted successfully`
    })

    if (result !== null) {
      items.value = items.value.filter(item => item[idKey] !== id)
    }

    return result
  }

  function reset() {
    items.value = []
    selectedItem.value = null
    error.value = null
  }

  return {
    // State
    items,
    selectedItem,
    isLoading,
    error,

    // Computed
    isEmpty,
    count,

    // Actions
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    reset
  }
}
