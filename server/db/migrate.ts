import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import crypto from 'crypto'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { sql } from 'drizzle-orm'
import { getDatabaseUrl } from '../utils/databaseUrls.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..', '..')

try { process.loadEnvFile(path.resolve(rootDir, '.env')) } catch { /* no .env is fine */ }

const migrationsFolder = path.join(__dirname)
const { Pool } = pg
const pool = new Pool({ connectionString: getDatabaseUrl() })
const db = drizzle(pool)

// If the schema already exists (set up via db:push) but the drizzle migrations
// table has no entries, baseline migration 0000 so migrate() doesn't try to
// re-apply it and fail on already-existing types/tables.
async function baselineIfNeeded() {
  const tableCheck = await db.execute(sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Ingredient'
  `)
  if (tableCheck.rows.length === 0) return // fresh DB — no baselining needed

  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS drizzle`)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT
    )
  `)

  // Record any missing migration files so migrate() knows the schema is up to date.
  // We check each entry individually so this is idempotent even if a previous run
  // only partially baselined (e.g. only recorded 0000 but not 0001).
  const { rows: existingRows } = await db.execute(sql`SELECT hash FROM drizzle.__drizzle_migrations`)
  const existingHashes = new Set((existingRows as Array<{ hash: string }>).map(r => r.hash))

  const journal = JSON.parse(fs.readFileSync(path.join(migrationsFolder, 'meta/_journal.json'), 'utf8'))
  let baselined = 0
  for (const entry of journal.entries as Array<{ idx: number; tag: string; when: number }>) {
    const sqlFile = path.join(migrationsFolder, `${entry.tag}.sql`)
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')
    const hash = crypto.createHash('sha256').update(sqlContent).digest('hex')
    if (existingHashes.has(hash)) continue
    await db.execute(sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${hash}, ${entry.when})
    `)
    baselined++
  }
  if (baselined > 0) {
    console.log(`Baselined ${baselined} migration(s) (schema already existed from db:push).`)
  }
}

console.log('Running migrations...')
await baselineIfNeeded()
await migrate(db, { migrationsFolder })
console.log('Migrations complete.')

await pool.end()
