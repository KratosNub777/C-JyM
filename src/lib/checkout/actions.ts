'use server'

import { headers } from 'next/headers'
import { ACTION_LIMIT_MESSAGE, withinActionLimit } from '@/lib/customerAuth/actionLimit'
import { getCustomerSession } from '@/lib/customerAuth/session'
import { getPayloadClient } from '@/lib/payload'
import { refreshOrderCache as refreshOrders } from './refreshOrderCache'
import { createCheckoutOrder, cancelCheckoutOrder } from './orders'
import type { CheckoutResult } from './model'

export async function placeOrder(input: unknown): Promise<CheckoutResult> {
  const session = await getCustomerSession(await headers())
  if (!session)
    return { ok: false, code: 'AUTH', message: 'Ingresá a tu cuenta para confirmar el pedido.' }
  // FAILED conserva el intento en el navegador: al reintentar se verifica el mismo pedido.
  if (!(await withinActionLimit('checkout', session.user.id)))
    return { ok: false, code: 'FAILED', message: ACTION_LIMIT_MESSAGE }
  try {
    const result = await createCheckoutOrder(await getPayloadClient(), session.user, input)
    if (result.ok && result.changedProductIds?.length) refreshOrders(result.orderId)
    return result.ok ? { ok: true, orderId: result.orderId } : result
  } catch (error) {
    console.error('No se pudo confirmar el pedido:', error)
    return {
      ok: false,
      code: 'FAILED',
      message: 'No pudimos confirmar el pedido. Reintentá para verificar este mismo pedido.',
    }
  }
}

export async function cancelOrder(orderId: number): Promise<CheckoutResult> {
  const session = await getCustomerSession(await headers())
  if (!session)
    return { ok: false, code: 'AUTH', message: 'Ingresá a tu cuenta para cancelar el pedido.' }
  if (!(await withinActionLimit('checkout', session.user.id)))
    return { ok: false, code: 'FAILED', message: ACTION_LIMIT_MESSAGE }
  try {
    const result = await cancelCheckoutOrder(await getPayloadClient(), session.user.id, orderId)
    if (result.ok) refreshOrders(result.orderId)
    return result.ok ? { ok: true, orderId: result.orderId } : result
  } catch (error) {
    console.error('No se pudo cancelar el pedido:', error)
    return {
      ok: false,
      code: 'FAILED',
      message: 'No pudimos cancelar el pedido. Intentá nuevamente.',
    }
  }
}
