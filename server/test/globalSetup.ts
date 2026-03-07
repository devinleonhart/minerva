import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { getTestDatabaseUrl } from '../utils/databaseUrls.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from project root so TEST_DATABASE_URL is available when running outside Docker
const rootDir = path.resolve(__dirname, '..', '..')
try { process.loadEnvFile(path.resolve(rootDir, '.env')) } catch { /* no .env file is fine */ }

export async function setup() {
  // Push the schema to the test database (only once globally)
  const dbUrl = getTestDatabaseUrl()

  const rootDir = path.resolve(__dirname, '..', '..')

  try {
    execSync('pnpm exec drizzle-kit push --force', {
      cwd: rootDir,
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: dbUrl
      }
    })
  } catch (error) {
    console.error('Failed to push schema to test database:', error)
    throw error
  }
}
