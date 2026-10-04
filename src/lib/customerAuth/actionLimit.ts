import { customerAuthPool } from './auth'
import { consumeWindowQuota, type WindowQuota } from './windowQuota'

// El rate limit de Better Auth solo cubre /api/auth. Las Server Actions de clientes (checkout y
// direcciones) exigen sesión, así que se limitan por cliente: un uso normal nunca llega a estos
// números, pero un script con una cuenta válida no puede martillar la base.
export const ACTION_LIMITS = {
  checkout: { max: 10, windowMs: 60_000 },
  addresses: { max: 20, windowMs: 60_000 },
} satisfies Record<string, WindowQuota>

export type LimitedAction = keyof typeof ACTION_LIMITS

export const ACTION_LIMIT_MESSAGE =
  'Hiciste muchos intentos seguidos. Esperá un minuto y reintentá.'

/** Si el conteo falla se deja pasar (queda en el log): la acción igual valida sesión y datos. */
export async function withinActionLimit(action: LimitedAction, customerId: string) {
  try {
    return await consumeWindowQuota(
      customerAuthPool,
      `action-limit:${action}:${customerId}`,
      ACTION_LIMITS[action],
    )
  } catch (error) {
    console.error('No se pudo contar el uso de la acción; se permite:', error)
    return true
  }
}
