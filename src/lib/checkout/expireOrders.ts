import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { releaseOrderStock, withOrderTransaction } from './orderTransactions'
import { DEFAULT_RESERVATION_HOURS } from './reservationPolicy'

type Options = { limit?: number; orderIds?: number[] }
export type ExpirationReport = {
  expired: number
  skipped: number
  failed: number
  backfilled: number
  hasMore: boolean
}

export async function expirePendingOrders(
  payload: Payload,
  options: Options = {},
): Promise<ExpirationReport> {
  const limit = options.limit ?? 25
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    throw new Error('Invalid expiration batch size')
  const report: ExpirationReport = {
    expired: 0,
    skipped: 0,
    failed: 0,
    backfilled: 0,
    hasMore: false,
  }
  // Internal fixture scoping; the HTTP job never accepts IDs from the caller.
  if (options.orderIds && !options.orderIds.length) return report
  const scope = options.orderIds
    ? sql`AND id IN (${sql.join(
        options.orderIds.map((id) => sql`${id}`),
        sql`, `,
      )})`
    : sql``
  const hours = DEFAULT_RESERVATION_HOURS
  const backfilled = await payload.db.execute({
    drizzle: payload.db.drizzle,
    sql: sql`
    WITH legacy AS (
      SELECT id FROM orders WHERE status = 'pending_payment' AND expires_at IS NULL ${scope}
      ORDER BY id LIMIT ${limit} FOR UPDATE SKIP LOCKED
    )
    UPDATE orders SET expires_at = orders.created_at + ${hours} * INTERVAL '1 hour', updated_at = NOW()
    FROM legacy WHERE orders.id = legacy.id RETURNING orders.id
  `,
  })
  report.backfilled = backfilled.rows.length
  const candidates = await payload.db.execute({
    drizzle: payload.db.drizzle,
    sql: sql`
    SELECT id FROM orders WHERE status = 'pending_payment' AND expires_at <= clock_timestamp() ${scope}
    ORDER BY expires_at, id LIMIT ${limit}
  `,
  })
  const started = Date.now()
  for (const candidate of candidates.rows) {
    if (Date.now() - started >= 20000) {
      report.hasMore = true
      break
    }
    const id = Number(candidate.id)
    try {
      const result = await withOrderTransaction(payload, async (req, db) => {
        await payload.db.execute({ db, sql: sql`SET LOCAL lock_timeout = '5s'` })
        const locked = await payload.db.execute({
          db,
          sql: sql`
          SELECT id FROM orders WHERE id = ${id} AND status = 'pending_payment'
          AND expires_at <= clock_timestamp() FOR UPDATE SKIP LOCKED
        `,
        })
        if (!locked.rows.length) return { ok: true, orderId: id }
        const order = await payload.findByID({
          collection: 'orders',
          id,
          req,
          depth: 0,
          overrideAccess: true,
        })
        const changedProductIds = await releaseOrderStock(payload, order, req, db, 'expired')
        return { ok: true, orderId: id, changedProductIds }
      })
      if (!result.ok) throw new Error(result.message)
      if (!result.changedProductIds?.length) {
        report.skipped++
        continue
      }
      const saved = await payload.findByID({
        collection: 'orders',
        id,
        depth: 0,
        overrideAccess: true,
      })
      if (saved.status !== 'expired') throw new Error('Expiration commit could not be verified')
      report.expired++
    } catch (error) {
      report.failed++
      payload.logger.error({
        err: error,
        orderId: id,
        msg: 'No se pudo vencer la reserva del pedido',
      })
    }
  }
  report.hasMore ||= candidates.rows.length === limit || backfilled.rows.length === limit
  return report
}
