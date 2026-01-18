import { defineConfig } from 'prisma/config'

// Determine database URL
// Priority: MINERVA_DATABASE_URL > default Docker service
function getDatabaseUrl(): string {
  if (process.env.MINERVA_DATABASE_URL) {
    return process.env.MINERVA_DATABASE_URL
  }

  // Default to Docker service name for local development
  return 'postgresql://postgres:postgres@postgres:5432/minerva'
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
