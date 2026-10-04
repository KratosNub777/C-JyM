// @vitest-environment node
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'

import { ACTION_LIMITS, withinActionLimit } from '@/lib/customerAuth/actionLimit'
import { customerAuthPool } from '@/lib/customerAuth/auth'

const customerId = `limite-${randomUUID()}`

afterAll(async () => {
  await customerAuthPool.query('DELETE FROM verification WHERE identifier LIKE $1', [
    `action-limit:%:${customerId}`,
  ])
  await customerAuthPool.end()
})

describe('withinActionLimit', () => {
  it('limits each action per customer independently', async () => {
    const { max } = ACTION_LIMITS.checkout
    const results: boolean[] = []
    for (let i = 0; i <= max; i++) results.push(await withinActionLimit('checkout', customerId))
    expect(results).toEqual([...Array(max).fill(true), false])

    // Las direcciones tienen su propio cupo, y otro cliente no se ve afectado.
    expect(await withinActionLimit('addresses', customerId)).toBe(true)
    const otherCustomer = `${customerId}-otro`
    expect(await withinActionLimit('checkout', otherCustomer)).toBe(true)
    await customerAuthPool.query('DELETE FROM verification WHERE identifier = $1', [
      `action-limit:checkout:${otherCustomer}`,
    ])
  })
})
