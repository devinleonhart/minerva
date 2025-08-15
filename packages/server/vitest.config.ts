import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    // Run tests sequentially to avoid database conflicts
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    env: {
      NODE_ENV: 'test',
      MINERVA_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/minerva_test'
    }
  }
})
