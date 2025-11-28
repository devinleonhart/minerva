import { defineConfig } from 'prisma/config'

// Construct database URL from individual components if MINERVA_DATABASE_URL is not provided
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

export default defineConfig({
  schema: './schema.prisma',
  migrations: {
    path: './migrations',
  },
  datasource: {
    url: getDatabaseUrl(),
  },
})
