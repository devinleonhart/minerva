import { defineConfig } from 'prisma/config'
import { getPrimaryDatabaseUrl } from '../src/config/databaseUrls.js'

export default defineConfig({
  schema: './schema.prisma',
  migrations: {
    path: './migrations',
  },
  datasource: {
    url: getPrimaryDatabaseUrl(),
  },
})
