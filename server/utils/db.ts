import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../db/index.js'
import { getDatabaseUrl } from './databaseUrls.js'

const { Pool } = pg

const pool = new Pool({ connectionString: getDatabaseUrl() })
export const db = drizzle(pool, { schema })
