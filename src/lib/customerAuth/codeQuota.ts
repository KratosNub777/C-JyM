import { createHash, randomUUID } from 'node:crypto'
import type { Pool } from 'pg'

// Tope de emails con código por destinatario. El rate limit de Better Auth es por IP: con muchas IPs
// se podía llenar de correos la casilla de una persona. Cinco por hora alcanzan para registrarse,
// reenviar un par de veces y recuperar la contraseña.
export const CODE_EMAILS_PER_WINDOW = 5
export const CODE_EMAIL_WINDOW_MINUTES = 60

// El contador vive en la tabla `verification` de Better Auth (una fila por email, que vence al
// terminar la ventana) para no sumar una tabla que obligue a migrar antes de desplegar. No sirve
// `rate_limit`: Better Auth borra ahí las filas más viejas que su ventana más larga (60 s). El email
// va hasheado para no dejarlo en claro en una tabla más.
const IDENTIFIER_PREFIX = 'email-code-quota:'
export const CODE_QUOTA_IDENTIFIER_PATTERN = `${IDENTIFIER_PREFIX}%`

export function codeQuotaIdentifier(email: string) {
  return IDENTIFIER_PREFIX + createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

/**
 * Cuenta un email con código para `email` y devuelve si todavía entra en el tope. El bloqueo por
 * identificador serializa pedidos simultáneos para que no lean el mismo conteo.
 */
export async function consumeCodeEmailQuota(
  pool: Pool,
  email: string,
  now = new Date(),
): Promise<boolean> {
  const identifier = codeQuotaIdentifier(email)
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
      const expiresAt = new Date(now.getTime() + CODE_EMAIL_WINDOW_MINUTES * 60_000)
      await client.query('DELETE FROM verification WHERE identifier = $1', [identifier])
      await client.query(
        'INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $5)',
        [randomUUID(), identifier, String(count), expiresAt, now],
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
    return count <= CODE_EMAILS_PER_WINDOW
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}
