import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import type { Order } from '@/payload-types'
import type { CheckoutResult } from './model'

export type OrderResult = CheckoutResult & { changedProductIds?: number[] }
export type OrderRequest = { transactionID: string | number }
export type OrderDatabase = NonNullable<PostgresAdapter['sessions']>[string]['db']

export class OrderError extends Error {
  constructor(
    public code: Exclude<CheckoutResult, { ok: true }>['code'],
    message: string,
  ) {
    super(message)
  }
}

export async function withOrderTransaction(
  payload: Payload,
  work: (req: OrderRequest, db: OrderDatabase) => Promise<OrderResult>,
): Promise<OrderResult> {
  const transactionID = await payload.db.beginTransaction()
  if (!transactionID) throw new Error('Checkout requires database transactions')
  const sessions = payload.db.sessions as PostgresAdapter['sessions']
  try {
    const result = await work({ transactionID }, sessions[transactionID].db)
    await payload.db.commitTransaction(transactionID)
    return result
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    if (error instanceof OrderError) return { ok: false, code: error.code, message: error.message }
    throw error
  }
}

export async function databaseNow(payload: Payload, db: OrderDatabase) {
  const result = await payload.db.execute({ db, sql: sql`SELECT clock_timestamp() AS now` })
  return new Date(result.rows[0].now as string | Date)
}

// Caller must hold the order row lock and confirm it is still pending.
export async function releaseOrderStock(
  payload: Payload,
  order: Order,
  req: OrderRequest,
  db: OrderDatabase,
  status: 'cancelled' | 'expired',
) {
  const items = [...order.items].sort((a, b) => a.productId - b.productId)
  const ids = items.map((item) => item.productId)
  const locked = await payload.db.execute({
    db,
    sql: sql`SELECT id FROM products WHERE id IN (${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )}) ORDER BY id FOR UPDATE`,
  })
  if (locked.rows.length !== ids.length)
    throw new OrderError(
      'CONFLICT',
      'No pudimos devolver el stock. Contactá al local para revisar este pedido.',
    )
  for (const item of items)
    await payload.db.execute({
      db,
      sql: sql`UPDATE products SET stock = stock + ${item.quantity}, updated_at = NOW() WHERE id = ${item.productId}`,
    })
  const finishedAt = (await databaseNow(payload, db)).toISOString()
  await payload.update({
    collection: 'orders',
    id: order.id,
    req,
    overrideAccess: true,
    data: {
      status,
      ...(status === 'expired' ? { expiredAt: finishedAt } : { cancelledAt: finishedAt }),
    },
  })
  return ids
}
