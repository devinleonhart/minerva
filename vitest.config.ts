import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['server/test/**/*.test.ts'],
    setupFiles: ['./server/test/setup.ts'],
    globalSetup: ['./server/test/globalSetup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    maxWorkers: 1,
    isolate: false,
    fileParallelism: false,
    env: { NODE_ENV: 'test' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './server/coverage',
      include: ['server/api/**/*.ts', 'server/utils/**/*.ts'],
      exclude: ['**/*.d.ts'],
      thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 }
    }
  }
})
