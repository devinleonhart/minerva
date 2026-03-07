import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { sql } from 'drizzle-orm'
import { getDatabaseUrl } from '../utils/databaseUrls.js'

// In production the Nitro bundle lives at /app/server/index.mjs and the
// migration SQL files are copied to /app/migrations/ by the Dockerfile.
// In development / test, skip — use `pnpm db:migrate` instead.
export default defineNitroPlugin(async () => {
  if (process.env.NODE_ENV !== 'production') return

  const migrationsFolder = path.join(process.cwd(), 'migrations')

  if (!fs.existsSync(migrationsFolder)) {
    console.warn('[migrate] Migrations folder not found at', migrationsFolder, '— skipping auto-migration.')
    return
  }

  const { Pool } = pg
  const pool = new Pool({ connectionString: getDatabaseUrl() })
  const db = drizzle(pool)

  try {
    await baselineIfNeeded(db, migrationsFolder)
    await migrate(db, { migrationsFolder })
    console.log('[migrate] Database migrations complete.')
  } catch (error) {
    console.error('[migrate] Migration failed — shutting down:', error)
    await pool.end()
    process.exit(1)
  }

  await pool.end()
})

// If the schema was previously set up via db:push (no migration tracking),
// record every already-applied migration in the tracking table so that
// migrate() doesn't try to re-run them and fail on existing objects.
async function baselineIfNeeded(
  db: ReturnType<typeof drizzle>,
  migrationsFolder: string
) {
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

  const { rows: existingRows } = await db.execute(sql`SELECT hash FROM drizzle.__drizzle_migrations`)
  const existingHashes = new Set((existingRows as Array<{ hash: string }>).map(r => r.hash))

  const journal = JSON.parse(fs.readFileSync(path.join(migrationsFolder, 'meta/_journal.json'), 'utf8'))
  let baselined = 0
  for (const entry of journal.entries as Array<{ tag: string; when: number }>) {
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
    console.log(`[migrate] Baselined ${baselined} migration(s) (schema pre-existed from db:push).`)
  }
}
