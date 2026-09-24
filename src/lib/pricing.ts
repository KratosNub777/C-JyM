export const INSTALLMENT_COUNTS = [2, 3, 4, 5, 6, 9, 12, 15] as const

export type InstallmentOption = {
  count: number
  perInstallment: number
  perInstallmentListPrice: number | null
}

/**
 * Cuotas sin interés: divide el precio en partes iguales. No hay tasa de
 * interés real cargada todavía (dato del cliente pendiente), así que nunca
 * se inventa un monto distinto a precio / cantidad de cuotas.
 */
export function getInstallmentOptions(
  price: number,
  compareAtPrice: number | null | undefined,
  counts: readonly number[] = INSTALLMENT_COUNTS,
): InstallmentOption[] {
  const hasDiscount = !!compareAtPrice && compareAtPrice > price

  return counts.map((count) => ({
    count,
    perInstallment: Math.round(price / count),
    perInstallmentListPrice: hasDiscount ? Math.round(compareAtPrice! / count) : null,
  }))
}
