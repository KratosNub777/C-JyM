import type { Metadata } from 'next'
import type { Where } from 'payload'

import { FilterBar } from '@/components/FilterBar'
import { Pagination } from '@/components/Pagination'
import { ProductCard } from '@/components/ProductCard'
import { mergeWhere, parseProductFilters, sortToPayload, type RawSearchParams } from '@/lib/productFilters'
import { getCachedProducts, getDistinctBrands, getOnSaleCount, getPriceBounds } from '@/lib/productQueries'

export const metadata: Metadata = {
  title: 'Productos',
  description: 'Todo el catálogo de electrodomésticos de Comercial José María.',
}

const PAGE_SIZE = 24

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams & { page?: string }>
}) {
  const resolvedParams = await searchParams
  const page = Number(resolvedParams.page) || 1
  const filters = parseProductFilters(resolvedParams)

  const baseWhere: Where[] = [{ status: { equals: 'active' } }]

  const [{ docs: products, totalPages, hasNextPage, hasPrevPage }, brands, priceBounds, onSaleCount] =
    await Promise.all([
      getCachedProducts(mergeWhere(baseWhere, filters), sortToPayload(filters.sort), page, PAGE_SIZE),
      getDistinctBrands({ and: baseWhere }),
      getPriceBounds({ and: baseWhere }),
      getOnSaleCount({ and: baseWhere }),
    ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">Productos</h1>

      <div className="mb-6">
        <FilterBar
          brands={brands}
          priceBounds={priceBounds}
          basePath="/productos"
          onSaleCount={onSaleCount}
        />
      </div>

      {products.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">No hay productos para mostrar.</p>
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
        basePath="/productos"
        searchParams={resolvedParams}
      />
    </div>
  )
}
