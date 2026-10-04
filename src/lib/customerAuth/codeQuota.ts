import { createHash } from 'node:crypto'
import type { Pool } from 'pg'
import { consumeWindowQuota } from './windowQuota'

// Tope de emails con código por destinatario. El rate limit de Better Auth es por IP: con muchas IPs
// se podía llenar de correos la casilla de una persona. Cinco por hora alcanzan para registrarse,
// reenviar un par de veces y recuperar la contraseña.
export const CODE_EMAILS_PER_WINDOW = 5
export const CODE_EMAIL_WINDOW_MINUTES = 60

// El email va hasheado para no dejarlo en claro en una tabla más.
export function codeQuotaIdentifier(email: string) {
  return 'email-code-quota:' + createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

/** Cuenta un email con código para `email` y devuelve si todavía entra en el tope. */
export function consumeCodeEmailQuota(pool: Pool, email: string, now = new Date()) {
  return consumeWindowQuota(
    pool,
    codeQuotaIdentifier(email),
    { max: CODE_EMAILS_PER_WINDOW, windowMs: CODE_EMAIL_WINDOW_MINUTES * 60_000 },
    now,
  )
}
