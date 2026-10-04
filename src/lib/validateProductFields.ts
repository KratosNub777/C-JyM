export const COMPARE_AT_PRICE_ERROR =
  'El precio de lista debe ser mayor al precio contado (es el precio tachado antes del descuento).'

/**
 * El precio de lista es el que se muestra tachado: solo tiene sentido si es mayor al precio
 * contado. Si es igual o menor, la tarjeta mostraría un "descuento" que en realidad sube el precio.
 */
export function isCompareAtPriceValid(price: number, compareAtPrice: number): boolean {
  return compareAtPrice > price
}

export function validateProductFields(input: {
  name: string
  hasCategory: boolean
  price: string
  stock: string
  compareAtPrice?: string
}): string | null {
  if (!input.name.trim()) return 'Falta el nombre.'
  if (!input.hasCategory) return 'Falta la categoría.'

  const price = Number(input.price)
  if (!input.price || Number.isNaN(price) || price < 0) return 'Precio inválido.'

  const stock = Number(input.stock)
  if (!input.stock || Number.isNaN(stock) || stock < 0) return 'Stock inválido.'

  if (input.compareAtPrice) {
    const compareAtPrice = Number(input.compareAtPrice)
    if (Number.isNaN(compareAtPrice) || compareAtPrice < 0) return 'Precio de lista inválido.'
    if (!isCompareAtPriceValid(price, compareAtPrice)) return COMPARE_AT_PRICE_ERROR
  }

  return null
}
