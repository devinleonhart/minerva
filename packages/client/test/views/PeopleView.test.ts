import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import PeopleView from '../../src/views/PeopleView.vue'
import { usePeopleStore } from '../../src/store/people'

// Mock the stores
vi.mock('../../src/store/people')

// Mock the toast composable
vi.mock('../../src/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn()
  })
}))

// Mock the components
vi.mock('../../src/components/shared/ViewLayout.vue', () => ({
  default: {
    name: 'ViewLayout',
    template: '<div class="view-layout"><slot /></div>'
  }
}))

vi.mock('../../src/components/shared/ViewHeader.vue', () => ({
  default: {
    name: 'ViewHeader',
    template: '<div class="view-header"><slot name="left" /><slot name="right" /></div>'
  }
}))

vi.mock('../../src/components/shared/GridLayout.vue', () => ({
  default: {
    name: 'GridLayout',
    template: '<div class="grid-layout"><slot /></div>'
  }
}))

vi.mock('../../src/components/shared/CardHeader.vue', () => ({
  default: {
    name: 'CardHeader',
    template: '<div class="card-header"><slot name="actions" /></div>'
  }
}))

vi.mock('../../src/components/people/AddPersonModal.vue', () => ({
  default: {
    name: 'AddPersonModal',
    template: '<div class="add-person-modal">Add Person Modal</div>'
  }
}))

vi.mock('../../src/components/people/EditPersonModal.vue', () => ({
  default: {
    name: 'EditPersonModal',
    template: '<div class="edit-person-modal">Edit Person Modal</div>'
  }
}))

const mockPeople = ref([])

const mockPeopleStore = {
  getPeople: vi.fn(),
  deletePerson: vi.fn(),
  toggleFavorite: vi.fn(),
  get people() { return mockPeople.value }
}

describe('PeopleView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // @ts-expect-error - Invalid store mock
    vi.mocked(usePeopleStore).mockReturnValue(mockPeopleStore)

    // Reset mock data for each test
    mockPeople.value = []
  })

  it('renders the view with header and add person button in the correct location', () => {
    const wrapper = mount(PeopleView)

    // Check that the view renders
    expect(wrapper.exists()).toBe(true)

    // Check that the add person button is in the header (left slot)
    const addButton = wrapper.find('.view-header button')
    expect(addButton.exists()).toBe(true)
    expect(addButton.text()).toBe('Add New Person')

    // Verify the button is in the header, not in a separate section
    expect(wrapper.find('.add-person-section').exists()).toBe(false)
  })
})
