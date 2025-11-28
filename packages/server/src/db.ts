import 'dotenv/config'
import { PrismaClient } from './generated/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

// Construct database URL from individual components if MINERVA_DATABASE_URL is not provided
// This handles URL encoding of special characters in passwords
function getDatabaseUrl(): string {
  if (process.env.MINERVA_DATABASE_URL) {
    return process.env.MINERVA_DATABASE_URL
  }

  const user = process.env.POSTGRES_USER || 'postgres'
  const password = process.env.POSTGRES_PASSWORD || 'postgres'
  const host = process.env.POSTGRES_HOST || 'postgres'
  const port = process.env.POSTGRES_PORT || '5432'
  const database = process.env.POSTGRES_DB || 'minerva'

  // URL-encode the password to handle special characters
  const encodedPassword = encodeURIComponent(password)

  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${database}`
}

const connectionString = getDatabaseUrl()
if (!connectionString) {
  throw new Error('Database connection string is required. Set MINERVA_DATABASE_URL or POSTGRES_* environment variables.')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })
