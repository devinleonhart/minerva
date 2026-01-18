import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { getTestDatabaseUrl } from '../src/config/databaseUrls.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function setup() {
  // Push the schema to the test database (only once globally)
  const dbUrl = getTestDatabaseUrl()

  // Get the root directory (two levels up from test directory)
  const rootDir = path.resolve(__dirname, '..', '..')

  try {
    execSync('pnpm prisma db push --schema=./server/prisma/schema.prisma --config=./server/prisma/prisma.config.ts', {
      cwd: rootDir,
      stdio: 'pipe',
      env: {
        ...process.env,
        MINERVA_DATABASE_URL: dbUrl
      }
    })
  } catch (error) {
    console.error('Failed to push schema to test database:', error)
    throw error
  }
}
