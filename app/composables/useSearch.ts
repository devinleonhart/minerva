import { ref, computed, watch, type Ref } from 'vue'

export interface SearchOptions<T> {
  items: Ref<T[]>
  searchFields: (keyof T)[]
  debounceMs?: number
  customFilter?: (item: T, query: string) => boolean
}

export function useSearch<T>(options: SearchOptions<T>) {
  const { items, searchFields, debounceMs = 300, customFilter } = options

  const searchQuery = ref('')
  const debouncedQuery = ref('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Debounce the search query
  watch(searchQuery, (newValue) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      debouncedQuery.value = newValue
    }, debounceMs)
  })

  const filteredItems = computed(() => {
    const query = debouncedQuery.value.toLowerCase().trim()

    if (!query) {
      return items.value
    }

    return items.value.filter(item => {
      if (customFilter) return customFilter(item, query)
      return searchFields.some(field => {
        const value = item[field]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query)
        }
        if (typeof value === 'number') {
          return value.toString().includes(query)
        }
        return false
      })
    })
  })

  function clearSearch() {
    searchQuery.value = ''
    debouncedQuery.value = ''
  }

  return {
    searchQuery,
    filteredItems,
    clearSearch,
    hasResults: computed(() => filteredItems.value.length > 0),
    resultCount: computed(() => filteredItems.value.length)
  }
}
