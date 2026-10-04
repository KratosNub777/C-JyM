// @vitest-environment node
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { deleteStaleUnverifiedAccounts, UNVERIFIED_ACCOUNT_DAYS } from '@/lib/customerAuth/cleanup'

const run = randomUUID().slice(0, 8)
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const day = 24 * 60 * 60_000
const users = {
  staleUnverified: { verified: false, ageDays: UNVERIFIED_ACCOUNT_DAYS + 1 },
  recentUnverified: { verified: false, ageDays: UNVERIFIED_ACCOUNT_DAYS - 1 },
  oldVerified: { verified: true, ageDays: UNVERIFIED_ACCOUNT_DAYS * 4 },
  staleWithAddress: { verified: false, ageDays: UNVERIFIED_ACCOUNT_DAYS + 1 },
}
const ids = Object.fromEntries(Object.keys(users).map((key) => [key, randomUUID()])) as Record<
  keyof typeof users,
  string
>

async function existingIds() {
  const { rows } = await pool.query('SELECT id FROM "user" WHERE id = ANY($1)', [
    Object.values(ids),
  ])
  return new Set(rows.map((row) => row.id as string))
}

describe('deleteStaleUnverifiedAccounts', () => {
  beforeAll(async () => {
    for (const [key, { verified, ageDays }] of Object.entries(users)) {
      const id = ids[key as keyof typeof users]
      const createdAt = new Date(Date.now() - ageDays * day)
      await pool.query(
        'INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $5)',
        [id, 'Cliente de prueba', `limpieza-${key}-${run}@example.com`, verified, createdAt],
      )
      await pool.query(
        'INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $2, $4, $5, $5)',
        [randomUUID(), id, 'credential', 'hash-de-prueba', createdAt],
      )
    }
    await pool.query(
      `INSERT INTO addresses (customer_id, full_name, phone, department, city, address_line)
       VALUES ($1, 'Cliente de prueba', '0981 123456', 'Central', 'Luque', 'Dirección de prueba')`,
      [ids.staleWithAddress],
    )
  })

  afterAll(async () => {
    await pool.query('DELETE FROM addresses WHERE customer_id = ANY($1)', [Object.values(ids)])
    await pool.query('DELETE FROM "user" WHERE id = ANY($1)', [Object.values(ids)])
    await pool.end()
  })

  it('deletes only unverified accounts older than the limit, with their credentials', async () => {
    const { deleted } = await deleteStaleUnverifiedAccounts(pool)
    expect(deleted).toBeGreaterThanOrEqual(1)

    const remaining = await existingIds()
    expect(remaining.has(ids.staleUnverified)).toBe(false)
    expect(remaining.has(ids.recentUnverified)).toBe(true)
    expect(remaining.has(ids.oldVerified)).toBe(true)
    expect(remaining.has(ids.staleWithAddress)).toBe(true)

    const { rows } = await pool.query('SELECT 1 FROM account WHERE "userId" = $1', [
      ids.staleUnverified,
    ])
    expect(rows).toHaveLength(0)
  })
})
