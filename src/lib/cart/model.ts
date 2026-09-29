export const CART_STORAGE_KEY = 'c-jym.cart.v1'
export const MAX_CART_ITEMS = 100
export const MAX_CART_QUANTITY = 999
// Payload uses PostgreSQL serial IDs (signed 32-bit integers).
export const MAX_PRODUCT_ID = 2_147_483_647

export function isProductId(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= MAX_PRODUCT_ID
  )
}

export type CartItem = { productId: number; quantity: number }
export type CartProduct = {
  id: number
  name: string
  slug: string
  price: number
  stock: number
  image: { url: string; alt: string } | null
}

export function quantityLimit(stock: number) {
  return Number.isFinite(stock) ? Math.max(0, Math.min(MAX_CART_QUANTITY, Math.floor(stock))) : 0
}

// Storage is untrusted. Prices and product details always come from the server.
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw || raw.length > 32_000) return []
  try {
    const value = JSON.parse(raw)
    if (value?.version !== 1 || !Array.isArray(value.items)) return []
    const items = new Map<number, CartItem>()
    for (const item of value.items) {
      if (
        !item ||
        !isProductId(item.productId) ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0
      )
        continue
      if (!items.has(item.productId) && items.size >= MAX_CART_ITEMS) continue
      const previous = items.get(item.productId)?.quantity ?? 0
      items.set(item.productId, {
        productId: item.productId,
        quantity: Math.min(MAX_CART_QUANTITY, previous + item.quantity),
      })
    }
    return [...items.values()]
  } catch {
    return []
  }
}

export async function fetchCartProducts(
  ids: number[],
  signal?: AbortSignal,
): Promise<CartProduct[]> {
  if (!ids.length) return []
  const response = await fetch(`/api/carrito?ids=${ids.join(',')}`, { cache: 'no-store', signal })
  if (!response.ok) throw new Error('No se pudo consultar el carrito.')
  const data: { products: CartProduct[] } = await response.json()
  return data.products
}
