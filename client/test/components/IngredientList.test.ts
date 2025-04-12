import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import IngredientList from '../../src/components/ingredient/IngredientList.vue'
import { useIngredientStore } from '../../src/store/ingredient'

vi.mock('../../src/store/ingredient')

describe('IngredientList.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('calls getIngredients on mount and renders items', async () => {
    const mockIngredients = ref([
      { id: 1, name: 'Ginger', description: 'Spicy root' },
      { id: 2, name: 'Basil', description: 'Herb' }
    ])

    const mockStore = {
      getIngredients: vi.fn().mockResolvedValue(undefined),
      ingredients: mockIngredients
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockStore as any)

    const wrapper = mount(IngredientList)
    await flushPromises()

    expect(mockStore.getIngredients).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Ginger - Spicy root')
    expect(wrapper.text()).toContain('Basil - Herb')
  })
})
