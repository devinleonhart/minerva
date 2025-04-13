import { execSync } from 'node:child_process'

// Generate client and migrate DB
execSync('pnpm generate:test', { stdio: 'inherit' })
execSync('pnpm migrate:test', { stdio: 'inherit' })

// Dynamic import after client is generated
const { seedTestDb } = await import('../prisma/seedTestDb.js')
await seedTestDb()

// Run tests
execSync('pnpm vitest --run', { stdio: 'inherit' })
