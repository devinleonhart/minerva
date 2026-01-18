const DEFAULT_USER = 'postgres'
const DEFAULT_PASSWORD = 'postgres'
const DEFAULT_PRIMARY_DB = 'minerva'
const DEFAULT_TEST_DB = 'minerva_test'

const primaryHost = 'postgres'
const primaryPort = '5432'

const testHost = 'postgres-test'
const testPort = '5432'

const isTestRuntime =
  process.env.NODE_ENV === 'test' ||
  process.env.VITEST === 'true' ||
  typeof process.env.VITEST_WORKER_ID !== 'undefined'

function buildUrl(user: string, password: string, host: string, port: string, database: string): string {
  return `postgresql://${user}:${password}@${host}:${port}/${database}`
}

export function getPrimaryDatabaseUrl(): string {
  // First check for explicit environment variable override (production, CI, etc.)
  if (process.env.MINERVA_DATABASE_URL) {
    return process.env.MINERVA_DATABASE_URL
  }

  // In test runtime, use test database
  if (isTestRuntime) {
    return getTestDatabaseUrl()
  }

  // Default to Docker service name for local development
  return buildUrl(DEFAULT_USER, DEFAULT_PASSWORD, primaryHost, primaryPort, DEFAULT_PRIMARY_DB)
}

export function getTestDatabaseUrl(): string {
  // Allow override for CI environments
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL
  }

  // Default to Docker service name for local development
  return buildUrl(DEFAULT_USER, DEFAULT_PASSWORD, testHost, testPort, DEFAULT_TEST_DB)
}
