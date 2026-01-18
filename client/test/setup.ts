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
      request: vi.fn(),
      interceptors: {
        response: {
          use: vi.fn()
        }
      }
    })),
    interceptors: {
      response: {
        use: vi.fn()
      }
    }
  }
}))

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => {
  return new Proxy({}, {
    get: (_, name) => ({
      name: `Mock${String(name)}`,
      render: () => null
    })
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
