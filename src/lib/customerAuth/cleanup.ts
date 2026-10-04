import type { Pool } from 'pg'

// Una cuenta que no verificó su email en una semana no va a hacerlo: si la persona vuelve, se
// registra de nuevo. Borrarlas evita que la tabla junte altas abandonadas o de emails ajenos.
export const UNVERIFIED_ACCOUNT_DAYS = 7

/**
 * Borra las cuentas de clientes sin verificar más viejas que `UNVERIFIED_ACCOUNT_DAYS`; sus filas de
 * `account` y `session` se van en cascada. Sin verificar no se puede iniciar sesión, así que no
 * deberían tener pedidos ni direcciones; igual se saltean las que tengan alguno, por las dudas.
 * Los códigos y contadores vencidos de `verification` no hace falta tocarlos: Better Auth los borra
 * en cada consulta.
 */
export async function deleteStaleUnverifiedAccounts(pool: Pool, now = new Date()) {
  const cutoff = new Date(now.getTime() - UNVERIFIED_ACCOUNT_DAYS * 24 * 60 * 60_000)
  const result = await pool.query(
    `DELETE FROM "user" u
     WHERE u."emailVerified" = false
       AND u."createdAt" < $1
       AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = u.id)
       AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.customer_id = u.id)`,
    [cutoff],
  )
  return { deleted: result.rowCount ?? 0 }
}
