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
  }

  return null
}
