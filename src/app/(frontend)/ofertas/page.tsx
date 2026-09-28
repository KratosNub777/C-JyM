import type { Metadata } from 'next'
import type { Where } from 'payload'

import { FilterBar } from '@/components/FilterBar'
import { Pagination } from '@/components/Pagination'
import { ProductCard } from '@/components/ProductCard'
import { mergeWhere, parseProductFilters, sortToPayload, type RawSearchParams } from '@/lib/productFilters'
import { getCachedProducts, getDistinctBrands, getPriceBounds } from '@/lib/productQueries'

export const metadata: Metadata = {
  title: 'Ofertas',
  description: 'Productos en oferta de Comercial José María.',
}

const PAGE_SIZE = 24

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams & { page?: string }>
}) {
  const resolvedParams = await searchParams
  const page = Number(resolvedParams.page) || 1
  const filters = parseProductFilters(resolvedParams)

  const baseWhere: Where[] = [
    { status: { equals: 'active' } },
    { compareAtPrice: { greater_than: 0 } },
  ]

  const [{ docs: products, totalPages, hasNextPage, hasPrevPage }, brands, priceBounds] =
    await Promise.all([
      getCachedProducts(mergeWhere(baseWhere, filters), sortToPayload(filters.sort), page, PAGE_SIZE),
      getDistinctBrands({ and: baseWhere }),
      getPriceBounds({ and: baseWhere }),
    ])

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">Ofertas</h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">
        Productos con descuento sobre el precio de lista.
      </p>

      <div className="mb-6">
        <FilterBar brands={brands} priceBounds={priceBounds} basePath="/ofertas" />
      </div>

      {products.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">No hay ofertas activas por ahora.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        basePath="/ofertas"
        searchParams={resolvedParams}
      />
    </div>
  )
}
