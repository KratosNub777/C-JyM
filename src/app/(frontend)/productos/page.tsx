import Link from 'next/link'

import { ProductCard } from '@/components/ProductCard'
import { getPayloadClient } from '@/lib/payload'

const PAGE_SIZE = 24

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Number(pageParam) || 1

  const payload = await getPayloadClient()

  const { docs: products, totalPages, hasNextPage, hasPrevPage } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'active' } },
    limit: PAGE_SIZE,
    page,
    sort: '-createdAt',
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Productos</h1>

      {products.length === 0 ? (
        <p className="text-neutral-500">No hay productos para mostrar.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4 text-sm">
          <Link
            href={`/productos?page=${page - 1}`}
            aria-disabled={!hasPrevPage}
            className={
              hasPrevPage
                ? 'font-medium text-neutral-700 hover:text-neutral-900'
                : 'pointer-events-none text-neutral-300'
            }
          >
            ← Anterior
          </Link>
          <span className="text-neutral-500">
            Página {page} de {totalPages}
          </span>
          <Link
            href={`/productos?page=${page + 1}`}
            aria-disabled={!hasNextPage}
            className={
              hasNextPage
                ? 'font-medium text-neutral-700 hover:text-neutral-900'
                : 'pointer-events-none text-neutral-300'
            }
          >
            Siguiente →
          </Link>
        </div>
      )}
    </div>
  )
}
