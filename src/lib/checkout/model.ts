import type { Order } from '@/payload-types'
import { isProductId, MAX_CART_ITEMS, MAX_CART_QUANTITY } from '../cart/model'

export type CheckoutInput = {
  requestId: string
  customerName: string
  phone: string
  notes: string
  items: { productId: number; quantity: number; expectedPrice: number }[]
}

export type CheckoutResult =
  | { ok: true; orderId: number }
  | {
      ok: false
      code: 'INVALID' | 'AUTH' | 'PRICES_CHANGED' | 'STOCK' | 'CONFLICT' | 'LIMIT' | 'FAILED'
      message: string
    }

export function parseCheckout(input: unknown): CheckoutInput | null {
  if (!input || typeof input !== 'object') return null
  const data = input as Record<string, unknown>
  if (
    typeof data.requestId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.requestId)
  )
    return null
  if (
    typeof data.customerName !== 'string' ||
    typeof data.phone !== 'string' ||
    typeof data.notes !== 'string'
  )
    return null
  const customerName = data.customerName.trim()
  const phone = data.phone.trim()
  const notes = data.notes.trim()
  if (
    !customerName ||
    customerName.length > 120 ||
    phone.length > 30 ||
    !/^[+\d\s().-]+$/.test(phone) ||
    phone.replace(/\D/g, '').length < 6 ||
    notes.length > 500
  )
    return null
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > MAX_CART_ITEMS)
    return null
  const items: CheckoutInput['items'] = []
  const ids = new Set<number>()
  for (const item of data.items) {
    if (!item || typeof item !== 'object') return null
    const { productId, quantity, expectedPrice } = item
    if (
      !isProductId(productId) ||
      ids.has(productId) ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_CART_QUANTITY ||
      !Number.isSafeInteger(expectedPrice) ||
      expectedPrice < 0
    )
      return null
    ids.add(productId)
    items.push({ productId, quantity, expectedPrice })
  }
  return {
    requestId: data.requestId.toLowerCase(),
    customerName,
    phone,
    notes,
    items: items.sort((a, b) => a.productId - b.productId),
  }
}

export function orderReference(id: number) {
  return `JM-${String(id).padStart(6, '0')}`
}

// Record exhaustivo: al agregar un estado a Orders, TypeScript obliga a darle una etiqueta acá
// en lugar de mostrarlo como "Pendiente de pago" en alguna pantalla.
const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  pending_payment: 'Pendiente de pago',
  cancelled: 'Cancelado',
  expired: 'Vencido',
}

export function orderStatusLabel(status: Order['status']) {
  return ORDER_STATUS_LABELS[status]
}
