export const DEFAULT_RESERVATION_HOURS = 24

export function reservationHours(value = process.env.ORDER_RESERVATION_HOURS): number {
  if (value === undefined) return DEFAULT_RESERVATION_HOURS
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 168) {
    throw new Error('ORDER_RESERVATION_HOURS debe ser un entero entre 1 y 168.')
  }
  return Number(value)
}

export function reservationDeadline(order: { expiresAt?: string | null; createdAt: string }) {
  return (
    order.expiresAt ??
    new Date(
      new Date(order.createdAt).getTime() + DEFAULT_RESERVATION_HOURS * 3600000,
    ).toISOString()
  )
}
