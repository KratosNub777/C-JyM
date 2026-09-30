import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

export type TransactionRequest = { transactionID: string | number }
export type TransactionDatabase = NonNullable<PostgresAdapter['sessions']>[string]['db']

// Runs `work` inside a Payload/Postgres transaction: commit on success, rollback and rethrow on
// any error. `req` goes to Payload local API calls; `db` to raw SQL through `payload.db.execute`.
export async function withTransaction<T>(
  payload: Payload,
  work: (req: TransactionRequest, db: TransactionDatabase) => Promise<T>,
): Promise<T> {
  const transactionID = await payload.db.beginTransaction()
  if (!transactionID) throw new Error('Database transactions are not available')
  const sessions = payload.db.sessions as PostgresAdapter['sessions']
  try {
    const result = await work({ transactionID }, sessions[transactionID].db)
    await payload.db.commitTransaction(transactionID)
    return result
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}
