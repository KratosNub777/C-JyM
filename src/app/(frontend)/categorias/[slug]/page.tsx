import type { Metadata } from 'next'
import type { Where } from 'payload'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { FilterBar } from '@/components/FilterBar'
import { Pagination } from '@/components/Pagination'
import { ProductCard } from '@/components/ProductCard'
import { getPayloadClient } from '@/lib/payload'
import {
  getDistinctBrands,
  getPriceBounds,
  mergeWhere,
  parseProductFilters,
  sortToPayload,
  type RawSearchParams,
} from '@/lib/productFilters'

const PAGE_SIZE = 24

const getCategoryBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  return docs[0] ?? null
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    return { title: 'Categoría no encontrada' }
  }

  return {
    title: category.name,
    description: `Productos de ${category.name} en Comercial José María.`,
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<RawSearchParams & { page?: string }>
}) {
  const { slug } = await params
  const resolvedParams = await searchParams
  const page = Number(resolvedParams.page) || 1
  const filters = parseProductFilters(resolvedParams)

  const payload = await getPayloadClient()
  const category = await getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const { docs: childCategories } = await payload.find({
    collection: 'categories',
    where: { parent: { equals: category.id } },
    limit: 50,
    depth: 0,
  })

  const categoryIds = [category.id, ...childCategories.map((child) => child.id)]
  const baseWhere: Where[] = [
    { category: { in: categoryIds } },
    { status: { equals: 'active' } },
  ]

  const [{ docs: products, totalPages, hasNextPage, hasPrevPage }, brands, priceBounds] =
    await Promise.all([
      payload.find({
        collection: 'products',
        where: mergeWhere(baseWhere, filters),
        limit: PAGE_SIZE,
        page,
        sort: sortToPayload(filters.sort),
      }),
      getDistinctBrands(payload, { and: baseWhere }),
      getPriceBounds(payload, { and: baseWhere }),
    ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {category.name}
      </h1>

      <div className="mb-6">
        <FilterBar brands={brands} priceBounds={priceBounds} basePath={`/categorias/${slug}`} />
      </div>

      {products.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          No hay productos en esta categoría todavía.
        </p>
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
        basePath={`/categorias/${slug}`}
        searchParams={resolvedParams}
      />
    </div>
  )
}
