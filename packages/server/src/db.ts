import 'dotenv/config'
import { PrismaClient } from './generated/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const { Pool } = pg

const connectionString = process.env.MINERVA_DATABASE_URL
if (!connectionString) {
  throw new Error('MINERVA_DATABASE_URL environment variable is required')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })
