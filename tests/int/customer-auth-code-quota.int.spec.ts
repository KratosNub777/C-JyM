// @vitest-environment node
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn<(message: { text: string }) => Promise<void>>(),
}))
vi.mock('@/lib/email/mailer', () => ({ sendEmail: mocks.sendEmail }))

import { auth, customerAuthPool } from '@/lib/customerAuth/auth'
import {
  CODE_EMAIL_WINDOW_MINUTES,
  CODE_EMAILS_PER_WINDOW,
  codeQuotaIdentifier,
  consumeCodeEmailQuota,
} from '@/lib/customerAuth/codeQuota'

const run = randomUUID().slice(0, 8)
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 12 })
const emails: string[] = []

function fixtureEmail(label: string) {
  const email = `cupo-${label}-${run}@example.com`
  emails.push(email)
  return email
}

async function quotaCount(email: string) {
  const { rows } = await pool.query('SELECT value FROM verification WHERE identifier = $1', [
    codeQuotaIdentifier(email),
  ])
  return rows[0] ? Number(rows[0].value) : 0
}

beforeEach(() => mocks.sendEmail.mockReset())

afterAll(async () => {
  await pool.query('DELETE FROM "user" WHERE email = ANY($1)', [emails])
  await pool.query(
    'DELETE FROM verification WHERE identifier = ANY($1) OR identifier LIKE ANY($2)',
    [emails.map(codeQuotaIdentifier), emails.map((email) => `%${email}`)],
  )
  await pool.end()
  await customerAuthPool.end()
})

describe('consumeCodeEmailQuota', () => {
  it('allows a limited number of code emails per address and window', async () => {
    const email = fixtureEmail('ventana')
    const now = new Date()
    const results: boolean[] = []
    for (let i = 0; i <= CODE_EMAILS_PER_WINDOW; i++)
      results.push(await consumeCodeEmailQuota(pool, email, now))
    expect(results).toEqual([...Array(CODE_EMAILS_PER_WINDOW).fill(true), false])

    // Otra dirección tiene su propio cupo, y sin distinguir mayúsculas.
    expect(await consumeCodeEmailQuota(pool, fixtureEmail('otra'), now)).toBe(true)
    expect(await consumeCodeEmailQuota(pool, email.toUpperCase(), now)).toBe(false)

    const afterWindow = new Date(now.getTime() + CODE_EMAIL_WINDOW_MINUTES * 60_000 + 1000)
    expect(await consumeCodeEmailQuota(pool, email, afterWindow)).toBe(true)
    expect(await quotaCount(email)).toBe(1)
  })

  it('does not let simultaneous requests exceed the limit', async () => {
    const email = fixtureEmail('simultaneo')
    const results = await Promise.all(
      Array.from({ length: 10 }, () => consumeCodeEmailQuota(pool, email)),
    )
    expect(results.filter(Boolean)).toHaveLength(CODE_EMAILS_PER_WINDOW)
    expect(await quotaCount(email)).toBe(10)
  })
})

describe('Better Auth code emails', () => {
  it('stops sending codes to an address past the limit and resends the same valid code', async () => {
    const email = fixtureEmail('cuenta')
    await pool.query(
      'INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, false, now(), now())',
      [randomUUID(), 'Cliente de prueba', email],
    )

    const requests = CODE_EMAILS_PER_WINDOW + 1
    for (let i = 0; i < requests; i++) {
      const response = await auth.api.sendVerificationOTP({
        body: { email, type: 'email-verification' },
      })
      expect(response).toEqual({ success: true })
    }

    // Fuera de un request los envíos corren en segundo plano: se espera a que cuenten todos y a que
    // salgan los permitidos. El que pasa del tope ya contó, así que no puede llegar un envío más.
    await vi.waitFor(
      async () => {
        expect(await quotaCount(email)).toBe(requests)
        expect(mocks.sendEmail).toHaveBeenCalledTimes(CODE_EMAILS_PER_WINDOW)
      },
      { timeout: 10_000, interval: 100 },
    )
    const codes = mocks.sendEmail.mock.calls.map(([message]) => message.text.match(/^\d{6}$/m)?.[0])
    expect(new Set(codes).size).toBe(1)
    expect(codes[0]).toMatch(/^\d{6}$/)
  })
})
