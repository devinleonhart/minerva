import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import IngredientView from '../../src/views/IngredientView.vue'
import { useIngredientStore } from '../../src/store/ingredient'

// Mock the stores and composables
vi.mock('../../src/store/ingredient')
vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn()
  })
}))

// Mock the child components
vi.mock('../../src/components/shared/ViewLayout.vue', () => ({
  default: {
    name: 'ViewLayout',
    template: '<div class="view-layout"><slot /></div>'
  }
}))

vi.mock('../../src/components/shared/ViewHeader.vue', () => ({
  default: {
    name: 'ViewHeader',
    template: '<div class="view-header"><slot name="left" /></div>',
    props: ['showSearch', 'searchPlaceholder', 'searchValue'],
    emits: ['update:search-value']
  }
}))

vi.mock('../../src/components/ingredient/IngredientList.vue', () => ({
  default: {
    name: 'IngredientList',
    template: '<div class="ingredient-list">Ingredient List</div>',
    props: ['searchQuery']
  }
}))

vi.mock('../../src/components/shared/CreateEntityModal.vue', () => ({
  default: {
    name: 'CreateEntityModal',
    template: '<div v-if="modelValue" class="create-modal">Modal Content</div>',
    props: ['modelValue', 'title', 'submitButtonText'],
    emits: ['submit', 'cancel', 'update:modelValue']
  }
}))

describe('IngredientView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the main components', () => {
    const mockStore = {
      addIngredient: vi.fn(),
      getIngredients: vi.fn()
    }

    // @ts-expect-error - mockStore is not a valid store
    vi.mocked(useIngredientStore).mockReturnValue(mockStore)

    const wrapper = mount(IngredientView)

    expect(wrapper.find('.view-layout').exists()).toBe(true)
    expect(wrapper.find('.view-header').exists()).toBe(true)
    expect(wrapper.find('.ingredient-list').exists()).toBe(true)
  })

  it('displays the "Add New Ingredient" button', () => {
    const mockStore = {
      addIngredient: vi.fn(),
      getIngredients: vi.fn()
    }

    // @ts-expect-error - mockStore is not a valid store
    vi.mocked(useIngredientStore).mockReturnValue(mockStore)

    const wrapper = mount(IngredientView)

    const addButton = wrapper.find('button')
    expect(addButton.exists()).toBe(true)
    expect(addButton.text()).toContain('Add New Ingredient')
  })

  it('opens create modal when add button is clicked', async () => {
    const mockStore = {
      addIngredient: vi.fn(),
      getIngredients: vi.fn()
    }

    // @ts-expect-error - mockStore is not a valid store
    vi.mocked(useIngredientStore).mockReturnValue(mockStore)

    const wrapper = mount(IngredientView)

    const addButton = wrapper.find('button')
    await addButton.trigger('click')

    expect(wrapper.find('.create-modal').exists()).toBe(true)
  })

  it('passes correct props to CreateEntityModal', () => {
    const mockStore = {
      addIngredient: vi.fn(),
      getIngredients: vi.fn()
    }

    // @ts-expect-error - mockStore is not a valid store
    vi.mocked(useIngredientStore).mockReturnValue(mockStore)

    const wrapper = mount(IngredientView)

    const modal = wrapper.findComponent({ name: 'CreateEntityModal' })
    expect(modal.props('title')).toBe('Add New Ingredient')
    expect(modal.props('submitButtonText')).toBe('Add Ingredient')
  })

  it('handles ingredient creation successfully', async () => {
    const mockStore = {
      addIngredient: vi.fn().mockResolvedValue(undefined),
      getIngredients: vi.fn().mockResolvedValue(undefined)
    }

    // @ts-expect-error - mockStore is not a valid store
    vi.mocked(useIngredientStore).mockReturnValue(mockStore)

    const wrapper = mount(IngredientView)

    // Open modal and submit
    const addButton = wrapper.find('button')
    await addButton.trigger('click')

    const modal = wrapper.findComponent({ name: 'CreateEntityModal' })
    const formData = { name: 'New Ingredient', description: 'Test description' }
    await modal.vm.$emit('submit', formData)

    expect(mockStore.addIngredient).toHaveBeenCalledWith(formData)
    expect(mockStore.getIngredients).toHaveBeenCalled()
  })

  it('handles ingredient creation errors', async () => {
    const mockStore = {
      addIngredient: vi.fn().mockRejectedValue(new Error('Creation failed')),
      getIngredients: vi.fn()
    }

    // @ts-expect-error - mockStore is not a valid store
    vi.mocked(useIngredientStore).mockReturnValue(mockStore)

    const wrapper = mount(IngredientView)

    // Open modal and submit
    const addButton = wrapper.find('button')
    await addButton.trigger('click')

    const modal = wrapper.findComponent({ name: 'CreateEntityModal' })
    const formData = { name: 'New Ingredient', description: 'Test description' }

    // This should handle the error gracefully
    await modal.vm.$emit('submit', formData)

    expect(mockStore.addIngredient).toHaveBeenCalledWith(formData)
    expect(mockStore.getIngredients).not.toHaveBeenCalled()
  })

  it('closes modal when cancel is clicked', async () => {
    const wrapper = mount(IngredientView)

    // Open modal
    const addButton = wrapper.find('button')
    await addButton.trigger('click')
    expect(wrapper.find('.create-modal').exists()).toBe(true)

    // Cancel modal
    const modal = wrapper.findComponent({ name: 'CreateEntityModal' })
    await modal.vm.$emit('cancel')
    await wrapper.vm.$nextTick()

    // Modal should be closed
    expect(wrapper.find('.create-modal').exists()).toBe(false)
  })

  it('passes search query to IngredientList component', async () => {
    const wrapper = mount(IngredientView)

    // Simulate search input by finding the ViewHeader and triggering search update
    const viewHeader = wrapper.findComponent({ name: 'ViewHeader' })
    await viewHeader.vm.$emit('update:search-value', 'test search')
    await wrapper.vm.$nextTick()

    const ingredientList = wrapper.findComponent({ name: 'IngredientList' })
    expect(ingredientList.props('searchQuery')).toBe('test search')
  })

  it('configures ViewHeader with search functionality', () => {
    const wrapper = mount(IngredientView)

    const viewHeader = wrapper.findComponent({ name: 'ViewHeader' })
    expect(viewHeader.props('showSearch')).toBe(true)
    expect(viewHeader.props('searchPlaceholder')).toBe('Search ingredients...')
  })

  it('updates search query when ViewHeader emits search-value update', async () => {
    const wrapper = mount(IngredientView)

    const viewHeader = wrapper.findComponent({ name: 'ViewHeader' })
    await viewHeader.vm.$emit('update:search-value', 'new search')

    // @ts-expect-error - wrapper.vm.searchQuery is not a valid property
    expect(wrapper.vm.searchQuery).toBe('new search')
  })
})
