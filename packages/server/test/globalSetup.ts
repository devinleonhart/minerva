import { execSync } from 'child_process'
import { getTestDatabaseUrl } from '../src/config/databaseUrls.js'

export async function setup() {
  // Push the schema to the test database (only once globally)
  const dbUrl = getTestDatabaseUrl()

  try {
    execSync('pnpm prisma db push --schema=./prisma/schema.prisma --config=./prisma/prisma.config.ts', {
      cwd: process.cwd(),
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
