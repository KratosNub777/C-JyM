import { createHash } from 'node:crypto'
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import type { Order } from '@/payload-types'
import { parseCheckout } from './model'
import {
  databaseNow,
  OrderError as CheckoutError,
  releaseOrderStock,
  withOrderTransaction as transaction,
  type OrderResult as Result,
} from './orderTransactions'
import { reservationDeadline, reservationHours } from './reservationPolicy'

type Customer = { id: string; email: string }
export async function createCheckoutOrder(
  payload: Payload,
  customer: Customer,
  untrusted: unknown,
): Promise<Result> {
  const input = parseCheckout(untrusted)
  if (!input)
    return { ok: false, code: 'INVALID', message: 'Revisá los datos del pedido y del contacto.' }
  const checkoutKey = `${customer.id}:${input.requestId}`
  const hours = reservationHours()
  const requestHash = createHash('sha256')
    .update(JSON.stringify({ ...input, email: customer.email }))
    .digest('hex')
  const result = await transaction(payload, async (req, db) => {
    // Serializes retries and creations from this customer, including across processes.
    await payload.db.execute({
      db,
      sql: sql`SELECT pg_advisory_xact_lock(hashtextextended(${`checkout:${customer.id}`}, 0))`,
    })
    const existing = await payload.find({
      collection: 'orders',
      where: { checkoutKey: { equals: checkoutKey } },
      limit: 1,
      depth: 0,
      req,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      if (existing.docs[0].requestHash !== requestHash)
        throw new CheckoutError(
          'CONFLICT',
          'Este intento corresponde a otro pedido. Recargá la página.',
        )
      return { ok: true, orderId: existing.docs[0].id }
    }
    const ids = input.items.map((item) => item.productId)
    await payload.db.execute({
      db,
      sql: sql`SELECT id FROM products WHERE id IN (${sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `,
      )}) ORDER BY id FOR UPDATE`,
    })
    const products = await payload.find({
      collection: 'products',
      where: { id: { in: ids } },
      limit: ids.length,
      depth: 0,
      req,
      overrideAccess: true,
    })
    let subtotal = 0
    const items: Order['items'] = input.items.map((item) => {
      const product = products.docs.find((product) => product.id === item.productId)
      if (
        !product ||
        product.status !== 'active' ||
        !Number.isSafeInteger(product.stock) ||
        product.stock < item.quantity
      )
        throw new CheckoutError(
          'STOCK',
          'Cambió la disponibilidad. Revisá las cantidades en tu carrito.',
        )
      if (
        !Number.isSafeInteger(product.price) ||
        product.price < 0 ||
        product.price !== item.expectedPrice
      )
        throw new CheckoutError(
          'PRICES_CHANGED',
          'Cambió un precio. Revisá el total actualizado antes de confirmar.',
        )
      const lineTotal = product.price * item.quantity
      subtotal += lineTotal
      if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(subtotal))
        throw new CheckoutError('INVALID', 'El importe del pedido no es válido.')
      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal,
      }
    })
    for (const item of items) {
      // Bypass product hooks; invalidate the public cache only after commit.
      await payload.db.execute({
        db,
        sql: sql`UPDATE products SET stock = stock - ${item.quantity}, updated_at = NOW() WHERE id = ${item.productId}`,
      })
    }
    const expiresAt = new Date(
      (await databaseNow(payload, db)).getTime() + hours * 3600000,
    ).toISOString()
    const order = await payload.create({
      collection: 'orders',
      req,
      overrideAccess: true,
      data: {
        customerId: customer.id,
        checkoutKey,
        requestHash,
        customerName: input.customerName,
        customerEmail: customer.email,
        phone: input.phone,
        notes: input.notes,
        fulfillment: 'pickup',
        status: 'pending_payment',
        expiresAt,
        subtotal,
        shippingFee: 0,
        total: subtotal,
        items,
      },
    })
    return { ok: true, orderId: order.id, changedProductIds: ids }
  })
  // The adapter may consume a commit error. Never acknowledge an unpersisted order.
  if (result.ok) {
    const saved = await payload.find({
      collection: 'orders',
      where: {
        and: [{ id: { equals: result.orderId } }, { checkoutKey: { equals: checkoutKey } }],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (!saved.docs.length) throw new Error('Order commit could not be verified')
  }
  return result
}

export async function cancelCheckoutOrder(
  payload: Payload,
  customerId: string,
  orderId: number,
): Promise<Result> {
  if (!Number.isSafeInteger(orderId) || orderId < 1)
    return { ok: false, code: 'INVALID', message: 'El pedido no existe.' }
  const result = await transaction(payload, async (req, db) => {
    await payload.db.execute({
      db,
      sql: sql`SELECT id FROM orders WHERE id = ${orderId} AND customer_id = ${customerId} FOR UPDATE`,
    })
    const found = await payload.find({
      collection: 'orders',
      where: { and: [{ id: { equals: orderId } }, { customerId: { equals: customerId } }] },
      limit: 1,
      depth: 0,
      req,
      overrideAccess: true,
    })
    const order = found.docs[0]
    if (!order) throw new CheckoutError('INVALID', 'El pedido no existe.')
    if (order.status === 'cancelled' || order.status === 'expired') return { ok: true, orderId }
    if (order.status !== 'pending_payment')
      throw new CheckoutError('CONFLICT', 'Este pedido ya no se puede cancelar.')
    const now = await databaseNow(payload, db)
    const status = new Date(reservationDeadline(order)) <= now ? 'expired' : 'cancelled'
    const ids = await releaseOrderStock(payload, order, req, db, status)
    return { ok: true, orderId, changedProductIds: ids }
  })
  if (result.ok) {
    const saved = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
    })
    if (saved.status !== 'cancelled' && saved.status !== 'expired')
      throw new Error('Cancellation commit could not be verified')
  }
  return result
}
