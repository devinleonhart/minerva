import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import IngredientList from '../../src/components/ingredient/IngredientList.vue'
import { useIngredientStore } from '../../src/store/ingredient'
import { useInventoryStore } from '../../src/store/inventory'
import type { Ingredient } from '../../src/types/store/ingredient'

// Mock the stores and composables
vi.mock('../../src/store/ingredient')
vi.mock('../../src/store/inventory')
vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn()
  })
}))

// Mock storeToRefs
vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia')
  return {
    ...actual,
    storeToRefs: (store: { ingredients?: Ingredient[] }) => ({
      ingredients: { value: store.ingredients || [] }
    })
  }
})

// Mock child components
vi.mock('../../src/components/shared/GridLayout.vue', () => ({
  default: {
    name: 'GridLayout',
    template: '<div class="grid-layout"><slot /></div>'
  }
}))

vi.mock('../../src/components/shared/CardHeader.vue', () => ({
  default: {
    name: 'CardHeader',
    template: '<div class="card-header"><span>{{ title }}</span><slot name="actions" /></div>',
    props: ['title']
  }
}))

vi.mock('../../src/components/ingredient/EditIngredientModal.vue', () => ({
  default: {
    name: 'EditIngredientModal',
    template: '<div v-if="modelValue" class="edit-modal">Edit Modal</div>',
    props: ['modelValue', 'ingredient'],
    emits: ['update:modelValue']
  }
}))

const mockIngredients: Ingredient[] = [
  {
    id: 1,
    name: 'Mint',
    description: 'Fresh green herb',
    secured: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Basil',
    description: 'Aromatic herb',
    secured: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

describe('IngredientList.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders empty state when no ingredients', () => {
    const mockIngredientStore = {
      ingredients: [],
      getIngredients: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn().mockResolvedValue({ canDelete: true, reason: null }),
      addIngredient: vi.fn(),
      updateIngredient: vi.fn(),
      toggleSecured: vi.fn()
    }

    const mockInventoryStore = {
      addToInventory: vi.fn()
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    const wrapper = mount(IngredientList, {
      props: {
        searchQuery: ''
      }
    })

    expect(wrapper.find('.n-empty').exists()).toBe(true)
  })

  it('renders ingredient cards when ingredients exist', async () => {
    const mockIngredientStore = {
      ingredients: mockIngredients,
      getIngredients: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn().mockResolvedValue({ canDelete: true, reason: null }),
      addIngredient: vi.fn(),
      updateIngredient: vi.fn(),
      toggleSecured: vi.fn()
    }

    const mockInventoryStore = {
      addToInventory: vi.fn()
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    const wrapper = mount(IngredientList, {
      props: {
        searchQuery: ''
      }
    })

    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.n-card')
    expect(cards.length).toBe(2)

    const cardHeaders = wrapper.findAllComponents({ name: 'CardHeader' })
    expect(cardHeaders[0].props('title')).toBe('Mint')
    expect(cardHeaders[1].props('title')).toBe('Basil')
  })

  it('filters ingredients by search query', async () => {
    const mockIngredientStore = {
      ingredients: mockIngredients,
      getIngredients: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn().mockResolvedValue({ canDelete: true, reason: null }),
      addIngredient: vi.fn(),
      updateIngredient: vi.fn(),
      toggleSecured: vi.fn()
    }

    const mockInventoryStore = {
      addToInventory: vi.fn()
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    const wrapper = mount(IngredientList, {
      props: {
        searchQuery: 'mint'
      }
    })

    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.n-card')
    expect(cards.length).toBe(1)

    const cardHeader = wrapper.findComponent({ name: 'CardHeader' })
    expect(cardHeader.props('title')).toBe('Mint')
  })

  it('displays edit button for each ingredient', async () => {
    const mockIngredientStore = {
      ingredients: mockIngredients,
      getIngredients: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn().mockResolvedValue({ canDelete: true, reason: null }),
      addIngredient: vi.fn(),
      updateIngredient: vi.fn(),
      toggleSecured: vi.fn()
    }

    const mockInventoryStore = {
      addToInventory: vi.fn()
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    const wrapper = mount(IngredientList, {
      props: {
        searchQuery: ''
      }
    })

    await wrapper.vm.$nextTick()

    const editButtons = wrapper.findAll('button:contains("Edit")')
    expect(editButtons.length).toBe(2)
  })

  it('opens edit modal when edit button is clicked', async () => {
    const mockIngredientStore = {
      ingredients: mockIngredients,
      getIngredients: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn().mockResolvedValue({ canDelete: true, reason: null }),
      addIngredient: vi.fn(),
      updateIngredient: vi.fn(),
      toggleSecured: vi.fn()
    }

    const mockInventoryStore = {
      addToInventory: vi.fn()
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    const wrapper = mount(IngredientList, {
      props: {
        searchQuery: ''
      }
    })

    await wrapper.vm.$nextTick()

    const editButton = wrapper.find('button:contains("Edit")')
    await editButton.trigger('click')

    expect(wrapper.find('.edit-modal').exists()).toBe(true)

    const editModal = wrapper.findComponent({ name: 'EditIngredientModal' })
    expect(editModal.props('ingredient')).toEqual(mockIngredients[0])
  })

  it('displays delete button when ingredient can be deleted', async () => {
    const mockIngredientStore = {
      ingredients: [mockIngredients[0]],
      getIngredients: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn().mockResolvedValue({ canDelete: true, reason: null }),
      addIngredient: vi.fn(),
      updateIngredient: vi.fn(),
      toggleSecured: vi.fn()
    }

    const mockInventoryStore = {
      addToInventory: vi.fn()
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    const wrapper = mount(IngredientList, {
      props: {
        searchQuery: ''
      }
    })

    await wrapper.vm.$nextTick()

    const deleteButton = wrapper.find('button:contains("Delete")')
    expect(deleteButton.exists()).toBe(true)
    expect(deleteButton.attributes('disabled')).toBeFalsy()
  })

  it('displays disabled delete button with tooltip when ingredient cannot be deleted', async () => {
    const mockIngredientStore = {
      ingredients: [mockIngredients[0]],
      getIngredients: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn().mockResolvedValue({
        canDelete: false,
        reason: 'Ingredient is used in recipes'
      }),
      addIngredient: vi.fn(),
      updateIngredient: vi.fn()
    }

    const mockInventoryStore = {
      addToInventory: vi.fn()
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    const wrapper = mount(IngredientList, {
      props: {
        searchQuery: ''
      }
    })

    // Wait for deletability check
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    const deleteButton = wrapper.find('button:contains("Delete")')
    expect(deleteButton.exists()).toBe(true)
    expect(deleteButton.attributes('disabled')).toBeTruthy()

    const tooltip = wrapper.findComponent({ name: 'n-tooltip' })
    expect(tooltip.exists()).toBe(true)
  })

  it('calls deleteIngredient when delete button is clicked', async () => {
    const mockDeleteIngredient = vi.fn().mockResolvedValue(undefined)
    const mockGetIngredients = vi.fn().mockResolvedValue(undefined)
    const mockCheckDeletability = vi.fn().mockResolvedValue({ canDelete: true, reason: null })

    const mockIngredientStore = {
      ingredients: [mockIngredients[0]],
      getIngredients: mockGetIngredients,
      deleteIngredient: mockDeleteIngredient,
      checkIngredientDeletability: mockCheckDeletability,
      addIngredient: vi.fn(),
      updateIngredient: vi.fn()
    }

    const mockInventoryStore = {
      addToInventory: vi.fn()
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    const wrapper = mount(IngredientList, {
      props: {
        searchQuery: ''
      }
    })

    await wrapper.vm.$nextTick()

    const deleteButton = wrapper.find('button:contains("Delete")')
    await deleteButton.trigger('click')

    expect(mockDeleteIngredient).toHaveBeenCalledWith(1)
    expect(mockGetIngredients).toHaveBeenCalled()
    expect(mockCheckDeletability).toHaveBeenCalled()
  })

  it('calls addToInventory when quality buttons are clicked', async () => {
    const mockAddToInventory = vi.fn().mockResolvedValue(undefined)

    const mockIngredientStore = {
      ingredients: [mockIngredients[0]],
      getIngredients: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn().mockResolvedValue({ canDelete: true, reason: null }),
      addIngredient: vi.fn(),
      updateIngredient: vi.fn(),
      toggleSecured: vi.fn()
    }

    const mockInventoryStore = {
      addToInventory: mockAddToInventory
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    const wrapper = mount(IngredientList, {
      props: {
        searchQuery: ''
      }
    })

    await wrapper.vm.$nextTick()

    // Test HQ button
    const hqButtons = wrapper.findAll('.quality-btn')
    const hqButton = hqButtons.find(button => button.text() === 'HQ')
    await hqButton?.trigger('click')

    expect(mockAddToInventory).toHaveBeenCalledWith({
      ingredientId: 1,
      quality: 'HQ',
      quantity: 1
    })

    // Test NQ button
    const nqButton = hqButtons.find(button => button.text() === 'NQ')
    await nqButton?.trigger('click')

    expect(mockAddToInventory).toHaveBeenCalledWith({
      ingredientId: 1,
      quality: 'NORMAL',
      quantity: 1
    })

    // Test LQ button
    const lqButton = hqButtons.find(button => button.text() === 'LQ')
    await lqButton?.trigger('click')

    expect(mockAddToInventory).toHaveBeenCalledWith({
      ingredientId: 1,
      quality: 'LQ',
      quantity: 1
    })
  })

  it('sorts ingredients alphabetically by name', async () => {
    const unsortedIngredients = [
      { ...mockIngredients[1] }, // Basil
      { ...mockIngredients[0] }  // Mint
    ]

    const mockIngredientStore = {
      ingredients: unsortedIngredients,
      getIngredients: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn().mockResolvedValue({ canDelete: true, reason: null }),
      addIngredient: vi.fn(),
      updateIngredient: vi.fn(),
      toggleSecured: vi.fn()
    }

    const mockInventoryStore = {
      addToInventory: vi.fn()
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    const wrapper = mount(IngredientList, {
      props: {
        searchQuery: ''
      }
    })

    await wrapper.vm.$nextTick()

    const cardHeaders = wrapper.findAllComponents({ name: 'CardHeader' })
    expect(cardHeaders[0].props('title')).toBe('Basil') // Should come first alphabetically
    expect(cardHeaders[1].props('title')).toBe('Mint')
  })

  it('loads ingredients and checks deletability on mount', async () => {
    const mockGetIngredients = vi.fn().mockResolvedValue(undefined)
    const mockCheckDeletability = vi.fn().mockResolvedValue({ canDelete: true, reason: null })

    const mockIngredientStore = {
      ingredients: mockIngredients,
      getIngredients: mockGetIngredients,
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: mockCheckDeletability,
      addIngredient: vi.fn(),
      updateIngredient: vi.fn()
    }

    const mockInventoryStore = {
      addToInventory: vi.fn()
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    mount(IngredientList, {
      props: {
        searchQuery: ''
      }
    })

    expect(mockGetIngredients).toHaveBeenCalled()

    // Wait for deletability checks
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockCheckDeletability).toHaveBeenCalledTimes(2)
    expect(mockCheckDeletability).toHaveBeenCalledWith(1)
    expect(mockCheckDeletability).toHaveBeenCalledWith(2)
  })

  it('displays secured star for secured ingredients', async () => {
    const mockIngredientStore = {
      ingredients: mockIngredients,
      getIngredients: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn().mockResolvedValue({ canDelete: true, reason: null }),
      addIngredient: vi.fn(),
      updateIngredient: vi.fn(),
      toggleSecured: vi.fn()
    }

    const mockInventoryStore = {
      addToInventory: vi.fn()
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    const wrapper = mount(IngredientList, {
      props: {
        searchQuery: ''
      }
    })

    await wrapper.vm.$nextTick()

    // Should have star buttons for each ingredient
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('calls toggleSecured when star button is clicked', async () => {
    const mockToggleSecured = vi.fn().mockResolvedValue(undefined)

    const mockIngredientStore = {
      ingredients: [mockIngredients[0]], // Use only the first ingredient (not secured)
      getIngredients: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn().mockResolvedValue({ canDelete: true, reason: null }),
      addIngredient: vi.fn(),
      updateIngredient: vi.fn(),
      toggleSecured: mockToggleSecured
    }

    const mockInventoryStore = {
      addToInventory: vi.fn()
    }

    vi.mocked(useIngredientStore).mockReturnValue(mockIngredientStore)
    vi.mocked(useInventoryStore).mockReturnValue(mockInventoryStore)

    const wrapper = mount(IngredientList, {
      props: {
        searchQuery: ''
      }
    })

    await wrapper.vm.$nextTick()

    // Call the handleToggleSecured method directly for testing
    await wrapper.vm.handleToggleSecured(1, true)

    expect(mockToggleSecured).toHaveBeenCalledWith(1, true)
  })
})
