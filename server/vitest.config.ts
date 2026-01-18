import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    globalSetup: ['./test/globalSetup.ts'],
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
    // Ensure test files run sequentially, not in parallel
    fileParallelism: false,
    env: {
      NODE_ENV: 'test'
    }
  }
})
