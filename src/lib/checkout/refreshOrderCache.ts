import { revalidatePath, revalidateTag } from 'next/cache'
import { PRODUCTS_TAG, REVALIDATE_IMMEDIATELY } from '@/lib/cacheTags'

export function refreshOrderCache(orderId?: number) {
  try {
    revalidateTag(PRODUCTS_TAG, REVALIDATE_IMMEDIATELY)
    revalidatePath('/cuenta/pedidos')
    if (orderId) revalidatePath(`/cuenta/pedidos/${orderId}`)
    else revalidatePath('/cuenta/pedidos/[id]', 'page')
  } catch (error) {
    console.error('No se pudo revalidar después del pedido:', error)
  }
}
