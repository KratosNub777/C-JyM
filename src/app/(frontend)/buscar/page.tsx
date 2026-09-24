import { ProductCard } from '@/components/ProductCard'
import { getPayloadClient } from '@/lib/payload'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const payload = await getPayloadClient()

  const { docs: products } = query
    ? (
        await payload.find({
          collection: 'products',
          where: {
            and: [
              { status: { equals: 'active' } },
              {
                or: [
                  { name: { contains: query } },
                  { brand: { contains: query } },
                  { description: { contains: query } },
                ],
              },
            ],
          },
          limit: 48,
        })
      )
    : { docs: [] }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {query ? `Resultados para "${query}"` : 'Buscar'}
      </h1>

      {!query ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          Escribí algo en el buscador para empezar.
        </p>
      ) : products.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          No encontramos productos que coincidan con tu búsqueda.
        </p>
      ) : (
        <>
          <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
            {products.length} {products.length === 1 ? 'producto encontrado' : 'productos encontrados'}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
