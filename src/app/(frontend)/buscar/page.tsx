import type { Metadata } from 'next'

import { FilterBar } from '@/components/FilterBar'
import { ProductCard } from '@/components/ProductCard'
import { getProductsIndex } from '@/lib/meilisearch'
import { getPayloadClient } from '@/lib/payload'
import {
  applyFiltersInMemory,
  getDistinctBrands,
  getPriceBounds,
  parseProductFilters,
  type RawSearchParams,
} from '@/lib/productFilters'
import type { Product } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Buscar',
  robots: { index: false },
}

async function searchProducts(query: string): Promise<Product[]> {
  let hitIds: number[] = []

  try {
    const results = await getProductsIndex().search(query, { limit: 48 })
    hitIds = results.hits.map((hit) => hit.id)
  } catch (error) {
    console.error('Meilisearch no respondió, la búsqueda devuelve vacío:', error)
    return []
  }

  if (hitIds.length === 0) return []

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [{ id: { in: hitIds } }, { status: { equals: 'active' } }] },
    limit: hitIds.length,
  })

  const docsById = new Map(docs.map((doc) => [doc.id, doc]))
  return hitIds.map((id) => docsById.get(id)).filter((doc): doc is Product => !!doc)
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams & { q?: string }>
}) {
  const resolvedParams = await searchParams
  const q = Array.isArray(resolvedParams.q) ? resolvedParams.q[0] : resolvedParams.q
  const query = q?.trim() ?? ''
  const filters = parseProductFilters(resolvedParams)

  const rawProducts = query ? await searchProducts(query) : []
  const products = query ? applyFiltersInMemory(rawProducts, filters) : []

  const payload = await getPayloadClient()
  const [brands, priceBounds] = query
    ? await Promise.all([
        getDistinctBrands(payload, { status: { equals: 'active' } }),
        getPriceBounds(payload, { status: { equals: 'active' } }),
      ])
    : [[], null]

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {query ? `Resultados para "${query}"` : 'Buscar'}
      </h1>

      {!query ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          Escribí algo en el buscador para empezar.
        </p>
      ) : (
        <>
          <div className="mb-6">
            <FilterBar brands={brands} priceBounds={priceBounds} basePath="/buscar" />
          </div>

          {products.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-400">
              No encontramos productos que coincidan con tu búsqueda.
            </p>
          ) : (
            <>
              <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                {products.length}{' '}
                {products.length === 1 ? 'producto encontrado' : 'productos encontrados'}
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
