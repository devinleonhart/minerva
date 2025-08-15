import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'


// Mock axios globally
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    }))
  }
}))

// Mock naive-ui components to avoid rendering issues in tests
vi.mock('naive-ui', () => ({
  NButton: {
    name: 'NButton',
    template: '<button :data-type="type" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'disabled', 'size', 'ghost'],
    emits: ['click']
  },
  NCard: { name: 'NCard', template: '<div class="n-card"><slot name="header" /><slot /></div>' },
  NModal: {
    name: 'NModal',
    template: '<div v-if="modelValue" class="n-modal"><div class="modal-title">{{ title }}</div><slot /></div>',
    props: ['modelValue', 'title', 'preset'],
    emits: ['update:modelValue']
  },
  NForm: {
    name: 'NForm',
    template: '<form @submit="$emit(\'submit\', $event)"><slot /></form>',
    props: ['model', 'labelPlacement'],
    emits: ['submit']
  },
  NFormItem: {
    name: 'NFormItem',
    template: '<div class="n-form-item"><label>{{ label }}</label><slot /></div>',
    props: ['label', 'path']
  },
  NInput: {
    name: 'NInput',
    template: '<input :type="type" :placeholder="placeholder" :value="value" @input="$emit(\'update:value\', $event.target.value)" :rows="rows" :required="required" />',
    props: ['value', 'type', 'placeholder', 'rows', 'required'],
    emits: ['update:value']
  },
  NSpace: {
    name: 'NSpace',
    template: '<div class="n-space" :style="{ justifyContent: justify }"><slot /></div>',
    props: ['justify']
  },
  NEmpty: { name: 'NEmpty', template: '<div class="n-empty">{{ description }}</div>', props: ['description'] },
  NTooltip: { name: 'NTooltip', template: '<div><slot name="trigger" /><div class="tooltip"><slot /></div></div>' },
  NLayout: { name: 'NLayout', template: '<div class="n-layout"><slot /></div>' },
  NLayoutHeader: { name: 'NLayoutHeader', template: '<header class="n-layout-header"><slot /></header>' },
  NLayoutContent: { name: 'NLayoutContent', template: '<main class="n-layout-content"><slot /></main>' },
  NConfigProvider: { name: 'NConfigProvider', template: '<div><slot /></div>' },
  NMessageProvider: { name: 'NMessageProvider', template: '<div><slot /></div>' },
  NNotificationProvider: { name: 'NNotificationProvider', template: '<div><slot /></div>' },
  darkTheme: {},
}))

// Setup global test configuration
beforeAll(() => {
  // Configure Vue Test Utils
  config.global.plugins = []
  config.global.stubs = {
    // Stub Naive UI components globally to prevent resolution warnings
    'n-button': {
      template: '<button :data-type="type" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
      props: ['type', 'disabled', 'size', 'ghost'],
      emits: ['click']
    },
    'n-layout': { template: '<div class="n-layout"><slot /></div>' },
    'n-layout-header': { template: '<header class="n-layout-header"><slot /></header>' },
    'n-layout-content': { template: '<main class="n-layout-content"><slot /></main>' },
    'n-config-provider': { template: '<div><slot /></div>' },
    'n-message-provider': { template: '<div><slot /></div>' },
    'n-notification-provider': { template: '<div><slot /></div>' },
    'n-modal': {
      template: '<div v-if="modelValue" class="n-modal"><div class="modal-title">{{ title }}</div><slot /></div>',
      props: ['modelValue', 'title', 'preset'],
      emits: ['update:modelValue']
    },
    'n-form': {
      template: '<form @submit="$emit(\'submit\', $event)"><slot /></form>',
      emits: ['submit']
    },
    'n-form-item': {
      template: '<div class="n-form-item"><label>{{ label }}</label><slot /></div>',
      props: ['label', 'path']
    },
    'n-input': {
      template: '<input :placeholder="placeholder" :value="value" @input="$emit(\'update:value\', $event.target.value)" />',
      props: ['value', 'placeholder'],
      emits: ['update:value']
    },
    'n-card': { template: '<div class="n-card"><slot /></div>' },
    'n-space': { template: '<div class="n-space"><slot /></div>' },
    'n-empty': { template: '<div class="n-empty"><slot /></div>' },
    'n-tooltip': { template: '<div><slot /></div>' }
  }
})

beforeEach(() => {
  // Create fresh Pinia instance for each test
  const pinia = createPinia()
  setActivePinia(pinia)

  // Reset all mocks
  vi.resetAllMocks()

  // Suppress Vue component resolution warnings in tests
  config.global.config.warnHandler = () => {
    // Suppress warnings about unresolved components
  }
})

afterEach(() => {
  vi.clearAllMocks()
})

afterAll(() => {
  vi.restoreAllMocks()
})

// Test utilities
export const createMockAxiosResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {}
})

export const mockAxiosError = (message: string, status = 500) => {
  const error = new Error(message) as Error & { response: { status: number; statusText: string; data: { error: string } } }
  error.response = {
    status,
    statusText: status >= 500 ? 'Internal Server Error' : 'Bad Request',
    data: { error: message }
  }
  return error
}
