import { randomUUID } from 'node:crypto'
import type { Pool } from 'pg'

// Contadores por ventana de tiempo, compartidos entre instancias serverless. Viven en la tabla
// `verification` de Better Auth (una fila por clave, que vence al terminar la ventana) para no sumar
// una tabla que obligue a migrar antes de desplegar; Better Auth borra las filas vencidas en cada
// consulta. No sirve `rate_limit`: ahí Better Auth borra las filas más viejas que su ventana más
// larga (60 s). Cada uso lleva su propio prefijo en la clave para no chocar con los códigos.

export type WindowQuota = { max: number; windowMs: number }

/**
 * Suma un uso a `identifier` y devuelve si todavía entra en el cupo de la ventana. El bloqueo por
 * identificador serializa pedidos simultáneos para que no lean el mismo conteo.
 */
export async function consumeWindowQuota(
  pool: Pool,
  identifier: string,
  { max, windowMs }: WindowQuota,
  now = new Date(),
): Promise<boolean> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [identifier])
    const { rows } = await client.query<{ id: string; value: string; expiresAt: Date }>(
      'SELECT id, value, "expiresAt" FROM verification WHERE identifier = $1 ORDER BY "createdAt" DESC LIMIT 1',
      [identifier],
    )
    const current = rows[0]
    let count: number
    if (!current || current.expiresAt <= now) {
      count = 1
      await client.query('DELETE FROM verification WHERE identifier = $1', [identifier])
      await client.query(
        'INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $5)',
        [randomUUID(), identifier, String(count), new Date(now.getTime() + windowMs), now],
      )
    } else {
      count = (Number.parseInt(current.value, 10) || 0) + 1
      await client.query('UPDATE verification SET value = $1, "updatedAt" = $2 WHERE id = $3', [
        String(count),
        now,
        current.id,
      ])
    }
    await client.query('COMMIT')
    return count <= max
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}
