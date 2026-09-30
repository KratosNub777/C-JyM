import { describe, expect, it } from 'vitest'

import { orderStatusLabel } from '@/lib/checkout/model'
import { formatDateTimePy } from '@/lib/format'

describe('orderStatusLabel', () => {
  it('names every order status', () => {
    expect(orderStatusLabel('pending_payment')).toBe('Pendiente de pago')
    expect(orderStatusLabel('cancelled')).toBe('Cancelado')
    expect(orderStatusLabel('expired')).toBe('Vencido')
  })
})

describe('formatDateTimePy', () => {
  it('shows Paraguay time regardless of the server time zone', () => {
    // 15:30 UTC is 12:30 in Asunción (UTC-3).
    const text = formatDateTimePy('2026-09-30T15:30:00.000Z')
    expect(text).toContain('2026')
    expect(text).toContain('12:30')
  })

  it('accepts a Date', () => {
    // 03:00 UTC del 5 de enero es la medianoche en Asunción, no la madrugada del servidor.
    const text = formatDateTimePy(new Date('2026-01-05T03:00:00.000Z'))
    expect(text).toMatch(/^5 /)
    expect(text).toContain('12:00')
  })
})
