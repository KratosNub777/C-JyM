import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { getMigrations } from 'better-auth/db/migration'
import { auth, customerAuthPool } from '../src/lib/customerAuth/auth'

// Uses the migration engine from the installed Better Auth version, not a floating CLI.
try {
  if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET || !process.env.BETTER_AUTH_URL) {
    throw new Error('Faltan DATABASE_URL, BETTER_AUTH_SECRET o BETTER_AUTH_URL.')
  }
  const migration = await getMigrations(auth.options)
  if (migration.schemaProblems.length) throw new Error(migration.schemaProblems.join('\n'))
  const sql = await migration.compileMigrations()
  if (process.argv.includes('--generate')) {
    await mkdir('migrations/customer-auth', { recursive: true })
    await writeFile('migrations/customer-auth/schema.sql', sql || '-- Schema up to date.\n')
    console.log('SQL generado en migrations/customer-auth/schema.sql')
  } else {
    await migration.runMigrations()
    console.log('Tablas de clientes actualizadas.')
  }
} finally {
  await customerAuthPool.end()
}
