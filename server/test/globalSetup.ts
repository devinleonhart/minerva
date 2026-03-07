import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { sql } from 'drizzle-orm'
import { getTestDatabaseUrl } from '../utils/databaseUrls.js'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from project root so TEST_DATABASE_URL is available when running outside Docker
const rootDir = path.resolve(__dirname, '..', '..')
try { process.loadEnvFile(path.resolve(rootDir, '.env')) } catch { /* no .env file is fine */ }

export async function setup() {
  const dbUrl = getTestDatabaseUrl()
  const pool = new Pool({ connectionString: dbUrl })
  const db = drizzle(pool)

  try {
    // Reset schema to guarantee a clean slate (handles fresh CI DBs and local dev DBs alike).
    // Drop both 'public' (tables/types) and 'drizzle' (migration tracking table) so
    // migrate() re-runs the full migration SQL rather than skipping it as already applied.
    await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`)
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`)
    await db.execute(sql`CREATE SCHEMA public`)
    await migrate(db, { migrationsFolder: path.join(rootDir, 'server/db') })
  } catch (error) {
    console.error('Failed to set up test database:', error)
    throw error
  } finally {
    await pool.end()
  }
}
