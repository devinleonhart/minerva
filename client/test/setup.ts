import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
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
      delete: vi.fn()
    }))
  }
}))

const sharedProps = {
  modelValue: { type: [String, Number, Boolean, Object, Array], default: undefined },
  value: { type: [String, Number, Boolean, Object, Array], default: undefined },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'default' },
  size: { type: String, default: 'medium' },
  ghost: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  title: { type: String, default: '' },
  preset: { type: String, default: '' },
  min: { type: Number, default: undefined },
  precision: { type: Number, default: undefined }
} as const

const createStub = (componentName: string) => {
  const tag =
    componentName.includes('Button') ? 'button' :
      componentName.includes('Input') ? 'input' :
        'div'

  return defineComponent({
    name: componentName,
    props: sharedProps,
    emits: ['click', 'submit', 'update:modelValue', 'update:value'],
    setup(props, { slots, emit }) {
      const handleClick = (event: Event) => emit('click', event)
      const handleInput = (event: Event) => {
        const target = event.target as HTMLInputElement | undefined
        emit('update:value', target?.value)
        emit('update:modelValue', target?.value)
      }

      return () => {
        const slotContent = [
          slots.trigger?.(),
          slots.default?.()
        ].flat().filter(Boolean)

        if (tag === 'button') {
          return h('button', {
            disabled: props.disabled,
            'data-component': componentName,
            onClick: handleClick
          }, slotContent.length ? slotContent : componentName)
        }

        if (tag === 'input') {
          const type = componentName.includes('Number') ? 'number' : 'text'
          return h('input', {
            value: props.modelValue ?? props.value ?? '',
            placeholder: props.placeholder,
            type,
            'data-component': componentName,
            onInput: handleInput
          })
        }

        return h('div', {
          'data-component': componentName,
          onClick: handleClick
        }, slotContent.length ? slotContent : componentName)
      }
    }
  })
}

const componentCache = new Map<string, ReturnType<typeof createStub>>()

// Mock naive-ui using a proxy so any component (present or future) automatically gets stubbed
vi.mock('naive-ui', () => {
  return new Proxy({}, {
    get: (_, componentName: string) => {
      if (componentName === 'darkTheme') {
        return {}
      }

      if (!componentCache.has(componentName)) {
        componentCache.set(componentName, createStub(componentName))
      }

      return componentCache.get(componentName)
    }
  })
})

// Setup global test configuration
beforeAll(() => {
  config.global.plugins = []
})

beforeEach(() => {
  const pinia = createPinia()
  setActivePinia(pinia)
  vi.resetAllMocks()

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
export const createMockAxiosResponse = (data: unknown, status = 200) => ({
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
