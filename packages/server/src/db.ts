import { PrismaClient } from './generated/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { getPrimaryDatabaseUrl } from './config/databaseUrls.js'

const { Pool } = pg

const connectionString = getPrimaryDatabaseUrl()

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })
