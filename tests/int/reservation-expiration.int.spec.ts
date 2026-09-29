// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { sql } from '@payloadcms/db-postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { cancelCheckoutOrder, createCheckoutOrder } from '@/lib/checkout/orders'
import { expirePendingOrders } from '@/lib/checkout/expireOrders'
import { reservationHours, reservationDeadline } from '@/lib/checkout/reservationPolicy'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/lib/meilisearch', () => ({
  syncProductToIndex: vi.fn(),
  removeProductFromIndex: vi.fn(),
}))

const customer = { id: `expiry-test-${randomUUID()}`, email: 'expiry-fixture@example.com' }
let payload: Payload
let categoryId: number
const productIds: number[] = []
async function fixture(stock = 3) {
  const product = await payload.create({
    collection: 'products',
    data: {
      name: 'Fixture vencimiento',
      slug: `expiry-${randomUUID()}`,
      category: categoryId,
      price: 25000,
      stock,
      status: 'active',
    },
  })
  productIds.push(product.id)
  const input = {
    requestId: randomUUID(),
    customerName: 'Fixture',
    phone: '0981123456',
    notes: '',
    items: [{ productId: product.id, quantity: 2, expectedPrice: product.price }],
  }
  const result = await createCheckoutOrder(payload, customer, {
    ...input,
    expiresAt: '2099-01-01T00:00:00Z',
  })
  if (!result.ok) throw new Error('Fixture creation failed')
  return { id: result.orderId, productId: product.id, input }
}
async function due(id: number) {
  await payload.db.execute({
    drizzle: payload.db.drizzle,
    sql: sql`UPDATE orders SET expires_at = clock_timestamp() - INTERVAL '1 minute' WHERE id = ${id}`,
  })
}
const readOrder = (id: number) => payload.findByID({ collection: 'orders', id, depth: 0 })
const stock = async (id: number) =>
  (await payload.findByID({ collection: 'products', id, depth: 0 })).stock

beforeAll(async () => {
  payload = await getPayload({ config })
  categoryId = (await payload.find({ collection: 'categories', limit: 1, depth: 0 })).docs[0].id
}, 60000)
afterAll(async () => {
  if (!payload) return
  await payload.delete({
    collection: 'orders',
    where: { customerId: { equals: customer.id } },
    overrideAccess: true,
  })
  for (const id of productIds) await payload.delete({ collection: 'products', id })
  await payload.destroy()
}, 60000)

describe('Reservation policy', () => {
  it('uses 24 hours and rejects invalid configuration', () => {
    expect(reservationHours('24')).toBe(24)
    expect(reservationHours('48')).toBe(48)
    expect(reservationDeadline({ createdAt: '2026-09-28T12:00:00.000Z' })).toBe(
      '2026-09-29T12:00:00.000Z',
    )
    for (const invalid of ['', '0', '-1', '1.5', '169', 'NaN'])
      expect(() => reservationHours(invalid)).toThrow()
    expect(
      reservationDeadline({
        createdAt: '2026-09-28T12:00:00.000Z',
        expiresAt: '2026-09-29T12:00:00.000Z',
      }),
    ).toBe('2026-09-29T12:00:00.000Z')
  })
})

describe('Postgres reservation expiration', () => {
  it('fixes a server deadline and does not expire future or cancelled orders', async () => {
    const order = await fixture()
    const saved = await readOrder(order.id)
    expect(
      new Date(saved.expiresAt!).getTime() - new Date(saved.createdAt).getTime(),
    ).toBeGreaterThan(23.99 * 3600000)
    expect(new Date(saved.expiresAt!).getTime() - new Date(saved.createdAt).getTime()).toBeLessThan(
      24.01 * 3600000,
    )
    expect((await expirePendingOrders(payload, { orderIds: [order.id] })).expired).toBe(0)
    await cancelCheckoutOrder(payload, customer.id, order.id)
    await due(order.id)
    expect((await expirePendingOrders(payload, { orderIds: [order.id] })).expired).toBe(0)
    expect((await readOrder(order.id)).status).toBe('cancelled')
    expect(await stock(order.productId)).toBe(3)
  }, 30000)

  it('expires a due order once under overlapping runs and preserves its retry key', async () => {
    const order = await fixture()
    await due(order.id)
    const results = await Promise.all([
      expirePendingOrders(payload, { orderIds: [order.id] }),
      expirePendingOrders(payload, { orderIds: [order.id] }),
    ])
    expect(results.reduce((sum, result) => sum + result.expired, 0)).toBe(1)
    expect((await readOrder(order.id)).status).toBe('expired')
    expect((await readOrder(order.id)).expiredAt).toBeTruthy()
    expect(await stock(order.productId)).toBe(3)
    expect((await expirePendingOrders(payload, { orderIds: [order.id] })).expired).toBe(0)
    expect((await cancelCheckoutOrder(payload, customer.id, order.id)).ok).toBe(true)
    const replay = await createCheckoutOrder(payload, customer, order.input)
    expect(replay).toMatchObject({ ok: true, orderId: order.id })
    expect(await stock(order.productId)).toBe(3)
  }, 30000)

  it('restores stock once when cancellation and expiration race', async () => {
    const order = await fixture()
    await due(order.id)
    await Promise.all([
      expirePendingOrders(payload, { orderIds: [order.id] }),
      cancelCheckoutOrder(payload, customer.id, order.id),
    ])
    expect((await readOrder(order.id)).status).toBe('expired')
    expect(await stock(order.productId)).toBe(3)
  }, 30000)

  it('rolls back stock on a persistence failure and recovers on the next run', async () => {
    const order = await fixture()
    await due(order.id)
    const update = vi
      .spyOn(payload, 'update')
      .mockRejectedValueOnce(new Error('Simulated expiry save failure'))
    try {
      expect((await expirePendingOrders(payload, { orderIds: [order.id] })).failed).toBe(1)
    } finally {
      update.mockRestore()
    }
    expect((await readOrder(order.id)).status).toBe('pending_payment')
    expect(await stock(order.productId)).toBe(1)
    expect((await expirePendingOrders(payload, { orderIds: [order.id] })).expired).toBe(1)
    expect(await stock(order.productId)).toBe(3)
  }, 30000)

  it('backfills legacy deadlines using creation time without extending a reservation', async () => {
    const order = await fixture()
    await payload.db.execute({
      drizzle: payload.db.drizzle,
      sql: sql`UPDATE orders SET created_at = clock_timestamp() - INTERVAL '25 hours', expires_at = NULL WHERE id = ${order.id}`,
    })
    const result = await expirePendingOrders(payload, { orderIds: [order.id] })
    expect(result).toMatchObject({ backfilled: 1, expired: 1, failed: 0 })
    const saved = await readOrder(order.id)
    expect(new Date(saved.expiresAt!).getTime() - new Date(saved.createdAt).getTime()).toBe(
      24 * 3600000,
    )
    expect(await stock(order.productId)).toBe(3)
  }, 30000)

  it('keeps an inconsistent order pending and continues expiring other orders', async () => {
    const broken = await fixture()
    const valid = await fixture()
    await due(broken.id)
    await due(valid.id)
    await payload.delete({ collection: 'products', id: broken.productId })
    productIds.splice(productIds.indexOf(broken.productId), 1)
    const result = await expirePendingOrders(payload, { orderIds: [broken.id, valid.id] })
    expect(result).toMatchObject({ expired: 1, failed: 1 })
    expect((await readOrder(broken.id)).status).toBe('pending_payment')
    expect((await readOrder(valid.id)).status).toBe('expired')
    expect(await stock(valid.productId)).toBe(3)
  }, 30000)

  it('bounds batches without touching unselected fixtures', async () => {
    const a = await fixture()
    const b = await fixture()
    await due(a.id)
    await due(b.id)
    expect((await expirePendingOrders(payload, { orderIds: [], limit: 1 })).expired).toBe(0)
    expect((await expirePendingOrders(payload, { orderIds: [a.id, b.id], limit: 1 })).hasMore).toBe(
      true,
    )
    expect((await expirePendingOrders(payload, { orderIds: [a.id, b.id], limit: 1 })).expired).toBe(
      1,
    )
    expect(await stock(a.productId)).toBe(3)
    expect(await stock(b.productId)).toBe(3)
  }, 30000)
})
