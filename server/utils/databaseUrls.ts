const isTestRuntime =
  process.env.NODE_ENV === 'test' ||
  process.env.VITEST === 'true' ||
  typeof process.env.VITEST_WORKER_ID !== 'undefined'

export function getDatabaseUrl(): string {
  if (isTestRuntime) {
    return process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/minerva_test'
  }
  return process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/minerva'
}

export function getTestDatabaseUrl(): string {
  return process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/minerva_test'
}
