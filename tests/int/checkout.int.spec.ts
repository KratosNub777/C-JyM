// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { sql } from '@payloadcms/db-postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { parseCheckout } from '@/lib/checkout/model'
import { cancelCheckoutOrder, createCheckoutOrder, MAX_PENDING_ORDERS } from '@/lib/checkout/orders'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/lib/meilisearch', () => ({
  syncProductToIndex: vi.fn(),
  removeProductFromIndex: vi.fn(),
}))

const run = randomUUID()
const customer = { id: `checkout-test-${run}`, email: `checkout-${run}@example.com` }
const other = { id: `checkout-other-${run}`, email: `other-${run}@example.com` }
const limited = { id: `checkout-limited-${run}`, email: `limited-${run}@example.com` }
let payload: Payload
let categoryId: number
const productIds: number[] = []

const input = (productId: number, quantity = 1, expectedPrice = 25000) => ({
  requestId: randomUUID(),
  customerName: 'Cliente de prueba',
  phone: '0981 123456',
  notes: '',
  items: [{ productId, quantity, expectedPrice }],
})
async function product(stock: number) {
  const created = await payload.create({
    collection: 'products',
    data: {
      name: `Checkout fixture ${run}`,
      slug: `checkout-fixture-${randomUUID()}`,
      category: categoryId,
      price: 25000,
      stock,
      status: 'active',
    },
  })
  productIds.push(created.id)
  return created.id
}
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
    where: { customerId: { in: [customer.id, other.id, limited.id] } },
    overrideAccess: true,
  })
  for (const id of productIds) await payload.delete({ collection: 'products', id })
  await payload.destroy()
}, 60000)

describe('Checkout input boundary', () => {
  it('rejects coercion, duplicates, fractions and oversized input; drops client identity and total', () => {
    const valid = input(1)
    expect(parseCheckout({ ...valid, customerId: 'victim', total: 0 })).toEqual(valid)
    for (const invalid of [
      { ...valid, requestId: 'retry' },
      { ...valid, phone: 'abcdef' },
      { ...valid, items: [] },
      { ...valid, items: [valid.items[0], valid.items[0]] },
      ...[
        { productId: '1' },
        { quantity: 0 },
        { quantity: 1.2 },
        { quantity: 1000 },
        { expectedPrice: -1 },
        { expectedPrice: 0.5 },
      ].map((fields) => ({ ...valid, items: [{ ...valid.items[0], ...fields }] })),
      { ...valid, notes: 'x'.repeat(501) },
    ])
      expect(parseCheckout(invalid)).toBeNull()
  })
})

describe('Postgres checkout transactions', () => {
  it('retries create only once and preserves immutable prices', async () => {
    const id = await product(3)
    const request = input(id, 2)
    const [first, retry] = await Promise.all([
      createCheckoutOrder(payload, customer, request),
      createCheckoutOrder(payload, customer, request),
    ])
    expect(first.ok).toBe(true)
    expect(retry.ok).toBe(true)
    if (!first.ok || !retry.ok) throw new Error('Order failed')
    expect(first.orderId).toBe(retry.orderId)
    expect(await stock(id)).toBe(1)
    const order = await payload.findByID({ collection: 'orders', id: first.orderId, depth: 0 })
    expect(order.total).toBe(50000)
    expect(order.status).toBe('pending_payment')
    expect(order.customerId).toBe(customer.id)
    await payload.update({ collection: 'products', id, data: { price: 30000 } })
    expect((await createCheckoutOrder(payload, customer, request)).ok).toBe(true)
    expect(
      (await payload.findByID({ collection: 'orders', id: first.orderId })).items[0].unitPrice,
    ).toBe(25000)
    expect(await stock(id)).toBe(1)
    expect(
      (await createCheckoutOrder(payload, customer, { ...request, phone: '0981999999' })).ok,
    ).toBe(false)
  }, 30000)

  it('sells the last unit to only one concurrent customer', async () => {
    const id = await product(1)
    const results = await Promise.all([
      createCheckoutOrder(payload, customer, input(id)),
      createCheckoutOrder(payload, other, input(id)),
    ])
    expect(results.filter((result) => result.ok)).toHaveLength(1)
    expect(results.find((result) => !result.ok)).toMatchObject({ code: 'STOCK' })
    expect(await stock(id)).toBe(0)
  }, 30000)

  it('rejects changed prices and mixed unavailable baskets without changing stock', async () => {
    const available = await product(2)
    const soldOut = await product(0)
    expect(await createCheckoutOrder(payload, customer, input(available, 1, 1))).toMatchObject({
      code: 'PRICES_CHANGED',
    })
    const request = input(available)
    request.items.push({ productId: soldOut, quantity: 1, expectedPrice: 25000 })
    expect(await createCheckoutOrder(payload, customer, request)).toMatchObject({ code: 'STOCK' })
    expect(await stock(available)).toBe(2)
    expect(
      (
        await payload.find({
          collection: 'orders',
          where: { checkoutKey: { equals: `${customer.id}:${request.requestId}` } },
        })
      ).docs,
    ).toHaveLength(0)
  }, 30000)

  it('rolls back stock when saving the order fails', async () => {
    const id = await product(2)
    const create = vi
      .spyOn(payload, 'create')
      .mockRejectedValueOnce(new Error('Simulated order persistence failure'))
    try {
      await expect(createCheckoutOrder(payload, customer, input(id))).rejects.toThrow('Simulated')
    } finally {
      create.mockRestore()
    }
    expect(await stock(id)).toBe(2)
  }, 30000)

  it('denies foreign cancellation and restores stock exactly once under concurrent retries', async () => {
    const id = await product(3)
    const request = input(id, 2)
    const placed = await createCheckoutOrder(payload, customer, request)
    if (!placed.ok) throw new Error('Order failed')
    expect((await cancelCheckoutOrder(payload, other.id, placed.orderId)).ok).toBe(false)
    expect(await stock(id)).toBe(1)
    const cancellations = await Promise.all([
      cancelCheckoutOrder(payload, customer.id, placed.orderId),
      cancelCheckoutOrder(payload, customer.id, placed.orderId),
    ])
    expect(cancellations.every((result) => result.ok)).toBe(true)
    expect(await stock(id)).toBe(3)
    expect((await payload.findByID({ collection: 'orders', id: placed.orderId })).status).toBe(
      'cancelled',
    )
    expect((await createCheckoutOrder(payload, customer, request)).ok).toBe(true)
    expect(await stock(id)).toBe(3)
  }, 30000)

  it('caps unexpired pending orders per customer without blocking retries', async () => {
    const id = await product(10)
    const placed: { orderId: number; request: ReturnType<typeof input> }[] = []
    for (let i = 0; i < MAX_PENDING_ORDERS; i++) {
      const request = input(id)
      const result = await createCheckoutOrder(payload, limited, request)
      if (!result.ok) throw new Error('Order failed')
      placed.push({ orderId: result.orderId, request })
    }
    expect(await stock(id)).toBe(10 - MAX_PENDING_ORDERS)

    // Otro pedido pasa el tope y no toca el stock; reintentar uno existente sigue funcionando.
    expect(await createCheckoutOrder(payload, limited, input(id))).toMatchObject({ code: 'LIMIT' })
    expect(await stock(id)).toBe(10 - MAX_PENDING_ORDERS)
    expect(await createCheckoutOrder(payload, limited, placed[0].request)).toEqual({
      ok: true,
      orderId: placed[0].orderId,
    })
    // Otro cliente no se ve afectado.
    expect((await createCheckoutOrder(payload, other, input(id))).ok).toBe(true)

    // Cancelar uno libera el cupo.
    expect((await cancelCheckoutOrder(payload, limited.id, placed[0].orderId)).ok).toBe(true)
    const afterCancel = await createCheckoutOrder(payload, limited, input(id))
    expect(afterCancel.ok).toBe(true)

    // Una reserva vencida no cuenta aunque el proceso automático todavía no la haya marcado.
    expect(await createCheckoutOrder(payload, limited, input(id))).toMatchObject({ code: 'LIMIT' })
    await payload.db.execute({
      drizzle: payload.db.drizzle,
      sql: sql`UPDATE orders SET expires_at = clock_timestamp() - INTERVAL '1 minute' WHERE id = ${placed[1].orderId}`,
    })
    expect((await createCheckoutOrder(payload, limited, input(id))).ok).toBe(true)
  }, 60000)
})
