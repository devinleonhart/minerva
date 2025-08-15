import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import EditIngredientModal from '../../src/components/ingredient/EditIngredientModal.vue'
import { useIngredientStore } from '../../src/store/ingredient'
import type { Ingredient } from '../../src/types/store/ingredient'

// Mock the stores
vi.mock('../../src/store/ingredient')
vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn()
  })
}))

const mockIngredient: Ingredient = {
  id: 1,
  name: 'Test Ingredient',
  description: 'Test Description',
  secured: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
}

describe('EditIngredientModal.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()

    // Set up default mock for ingredient store
    vi.mocked(useIngredientStore).mockReturnValue({
      updateIngredient: vi.fn(),
      getIngredients: vi.fn(),
      ingredients: [],
      addIngredient: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn()
    })
  })

  it('accepts correct props', () => {
    const wrapper = mount(EditIngredientModal, {
      props: {
        modelValue: false,
        ingredient: null
      }
    })

    expect(wrapper.props('modelValue')).toBe(false)
    expect(wrapper.props('ingredient')).toBe(null)
  })

  it('accepts ingredient prop correctly', () => {
    const wrapper = mount(EditIngredientModal, {
      props: {
        modelValue: true,
        ingredient: mockIngredient
      }
    })

    expect(wrapper.props('ingredient')).toEqual(mockIngredient)
  })

  it('initializes form data correctly when ingredient prop changes', async () => {
    const wrapper = mount(EditIngredientModal, {
      props: {
        modelValue: true,
        ingredient: mockIngredient
      }
    })

    await wrapper.vm.$nextTick()

    // Access the component's reactive form data
    const formData = wrapper.vm.formData
    expect(formData.name).toBe(mockIngredient.name)
    expect(formData.description).toBe(mockIngredient.description)
  })

  it('updates form data when ingredient prop changes', async () => {
    const wrapper = mount(EditIngredientModal, {
      props: {
        modelValue: true,
        ingredient: mockIngredient
      }
    })

    const newIngredient: Ingredient = {
      ...mockIngredient,
      id: 2,
      name: 'New Ingredient',
      description: 'New Description'
    }

    await wrapper.setProps({ ingredient: newIngredient })
    await wrapper.vm.$nextTick()

    const formData = wrapper.vm.formData
    expect(formData.name).toBe(newIngredient.name)
    expect(formData.description).toBe(newIngredient.description)
  })

  it('emits update:modelValue when show computed setter is called', async () => {
    const wrapper = mount(EditIngredientModal, {
      props: {
        modelValue: true,
        ingredient: mockIngredient
      }
    })

    // Directly test the computed setter
    wrapper.vm.show = false

    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events?.[0][0]).toBe(false)
  })

  it('calls updateIngredient when handleSubmit is invoked', async () => {
    const mockUpdateIngredient = vi.fn().mockResolvedValue(undefined)
    const mockGetIngredients = vi.fn().mockResolvedValue(undefined)

    vi.mocked(useIngredientStore).mockReturnValue({
      updateIngredient: mockUpdateIngredient,
      getIngredients: mockGetIngredients,
      ingredients: [],
      addIngredient: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn()
    })

    const wrapper = mount(EditIngredientModal, {
      props: {
        modelValue: true,
        ingredient: mockIngredient
      }
    })

    // Modify form data
    wrapper.vm.formData.name = 'Updated Name'
    wrapper.vm.formData.description = 'Updated Description'

    // Call handleSubmit directly
    await wrapper.vm.handleSubmit()

    expect(mockUpdateIngredient).toHaveBeenCalledWith(1, {
      name: 'Updated Name',
      description: 'Updated Description'
    })
    expect(mockGetIngredients).toHaveBeenCalled()
  })

  it('handles form submission errors gracefully', async () => {
    const mockUpdateIngredient = vi.fn().mockRejectedValue(new Error('Update failed'))
    const mockGetIngredients = vi.fn()

    vi.mocked(useIngredientStore).mockReturnValue({
      updateIngredient: mockUpdateIngredient,
      getIngredients: mockGetIngredients,
      ingredients: [],
      addIngredient: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn()
    })

    const wrapper = mount(EditIngredientModal, {
      props: {
        modelValue: true,
        ingredient: mockIngredient
      }
    })

    await wrapper.vm.handleSubmit()

    expect(mockUpdateIngredient).toHaveBeenCalled()
    expect(mockGetIngredients).not.toHaveBeenCalled()
  })

  it('does not submit when ingredient is null', async () => {
    const mockUpdateIngredient = vi.fn()

    vi.mocked(useIngredientStore).mockReturnValue({
      updateIngredient: mockUpdateIngredient,
      getIngredients: vi.fn(),
      ingredients: [],
      addIngredient: vi.fn(),
      deleteIngredient: vi.fn(),
      checkIngredientDeletability: vi.fn()
    })

    const wrapper = mount(EditIngredientModal, {
      props: {
        modelValue: true,
        ingredient: null
      }
    })

    await wrapper.vm.handleSubmit()

    expect(mockUpdateIngredient).not.toHaveBeenCalled()
  })
})
