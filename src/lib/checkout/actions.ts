'use server'

import { headers } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getCustomerSession } from '@/lib/customerAuth/session'
import { getPayloadClient } from '@/lib/payload'
import { PRODUCTS_TAG, REVALIDATE_IMMEDIATELY } from '@/lib/cacheTags'
import { createCheckoutOrder, cancelCheckoutOrder } from './orders'
import type { CheckoutResult } from './model'

export async function placeOrder(input: unknown): Promise<CheckoutResult> {
  const session = await getCustomerSession(await headers())
  if (!session)
    return { ok: false, code: 'AUTH', message: 'Ingresá a tu cuenta para confirmar el pedido.' }
  try {
    const result = await createCheckoutOrder(await getPayloadClient(), session.user, input)
    if (result.ok && result.changedProductIds?.length) refreshOrders()
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
  try {
    const result = await cancelCheckoutOrder(await getPayloadClient(), session.user.id, orderId)
    if (result.ok) refreshOrders()
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

function refreshOrders() {
  // Cache errors cannot turn an already committed order into a failed checkout.
  try {
    revalidateTag(PRODUCTS_TAG, REVALIDATE_IMMEDIATELY)
    revalidatePath('/cuenta/pedidos', 'layout')
  } catch (error) {
    console.error('No se pudo revalidar después del pedido:', error)
  }
}
