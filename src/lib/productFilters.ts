import type { Payload, Where } from 'payload'

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc'

export const SORT_OPTIONS: { value: SortOption; label: string; payloadSort: string }[] = [
  { value: 'newest', label: 'Más nuevos', payloadSort: '-createdAt' },
  { value: 'price-asc', label: 'Precio: menor a mayor', payloadSort: 'price' },
  { value: 'price-desc', label: 'Precio: mayor a menor', payloadSort: '-price' },
  { value: 'name-asc', label: 'Nombre: A-Z', payloadSort: 'name' },
]

const DEFAULT_SORT: SortOption = 'newest'

export type ParsedProductFilters = {
  sort: SortOption
  brands: string[]
  minPrice?: number
  maxPrice?: number
  onSale: boolean
}

export type RawSearchParams = Record<string, string | string[] | undefined>

export function parseProductFilters(searchParams: RawSearchParams): ParsedProductFilters {
  const sortParam = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort
  const sort = SORT_OPTIONS.some((option) => option.value === sortParam)
    ? (sortParam as SortOption)
    : DEFAULT_SORT

  const rawBrand = searchParams.brand
  const brands = (Array.isArray(rawBrand) ? rawBrand : rawBrand ? [rawBrand] : []).filter(Boolean)

  const minRaw = Array.isArray(searchParams.min) ? searchParams.min[0] : searchParams.min
  const maxRaw = Array.isArray(searchParams.max) ? searchParams.max[0] : searchParams.max

  let minPrice = minRaw !== undefined ? Number(minRaw) : undefined
  let maxPrice = maxRaw !== undefined ? Number(maxRaw) : undefined
  if (minPrice !== undefined && (Number.isNaN(minPrice) || minPrice < 0)) minPrice = undefined
  if (maxPrice !== undefined && (Number.isNaN(maxPrice) || maxPrice < 0)) maxPrice = undefined
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    ;[minPrice, maxPrice] = [maxPrice, minPrice]
  }

  const saleRaw = Array.isArray(searchParams.sale) ? searchParams.sale[0] : searchParams.sale
  const onSale = saleRaw === '1'

  return { sort, brands, minPrice, maxPrice, onSale }
}

export function sortToPayload(sort: SortOption): string {
  return SORT_OPTIONS.find((option) => option.value === sort)?.payloadSort ?? '-createdAt'
}

export function filtersToWhere(filters: ParsedProductFilters): Where[] {
  const conditions: Where[] = []
  if (filters.brands.length > 0) conditions.push({ brand: { in: filters.brands } })
  if (filters.minPrice !== undefined) {
    conditions.push({ price: { greater_than_equal: filters.minPrice } })
  }
  if (filters.maxPrice !== undefined) {
    conditions.push({ price: { less_than_equal: filters.maxPrice } })
  }
  if (filters.onSale) {
    conditions.push({ compareAtPrice: { greater_than: 0 } })
  }
  return conditions
}

export function mergeWhere(base: Where[], filters: ParsedProductFilters): Where {
  return { and: [...base, ...filtersToWhere(filters)] }
}

export function hasActiveFilters(filters: ParsedProductFilters): boolean {
  return (
    filters.brands.length > 0 ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.onSale ||
    filters.sort !== DEFAULT_SORT
  )
}

export function applyFiltersInMemory<
  T extends { brand?: string | null; price: number; name: string; compareAtPrice?: number | null },
>(docs: T[], filters: ParsedProductFilters): T[] {
  let result = docs

  if (filters.brands.length > 0) {
    result = result.filter((doc) => !!doc.brand && filters.brands.includes(doc.brand))
  }
  if (filters.minPrice !== undefined) {
    result = result.filter((doc) => doc.price >= filters.minPrice!)
  }
  if (filters.maxPrice !== undefined) {
    result = result.filter((doc) => doc.price <= filters.maxPrice!)
  }
  if (filters.onSale) {
    result = result.filter((doc) => !!doc.compareAtPrice && doc.compareAtPrice > 0)
  }

  if (filters.sort === 'price-asc') {
    result = [...result].sort((a, b) => a.price - b.price)
  } else if (filters.sort === 'price-desc') {
    result = [...result].sort((a, b) => b.price - a.price)
  } else if (filters.sort === 'name-asc') {
    result = [...result].sort((a, b) => a.name.localeCompare(b.name))
  }

  return result
}

export async function getDistinctBrands(payload: Payload, where: Where): Promise<string[]> {
  const { values } = await payload.findDistinct({
    collection: 'products',
    field: 'brand',
    where,
  })

  return values
    .map((value) => value.brand)
    .filter((brand): brand is string => !!brand)
    .sort((a, b) => a.localeCompare(b))
}

export async function getOnSaleCount(payload: Payload, where: Where): Promise<number> {
  const { totalDocs } = await payload.count({
    collection: 'products',
    where: { and: [where, { compareAtPrice: { greater_than: 0 } }] },
  })
  return totalDocs
}

export async function getPriceBounds(
  payload: Payload,
  where: Where,
): Promise<{ min: number; max: number } | null> {
  const { docs } = await payload.find({
    collection: 'products',
    where,
    select: { price: true },
    limit: 500,
    depth: 0,
  })

  if (docs.length === 0) return null

  return docs.reduce(
    (bounds, doc) => ({
      min: Math.min(bounds.min, doc.price),
      max: Math.max(bounds.max, doc.price),
    }),
    { min: docs[0].price, max: docs[0].price },
  )
}
