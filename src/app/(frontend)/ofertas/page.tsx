import { ProductCard } from '@/components/ProductCard'
import { getPayloadClient } from '@/lib/payload'

export default async function OfertasPage() {
  const payload = await getPayloadClient()

  const { docs: products } = await payload.find({
    collection: 'products',
    where: {
      and: [{ status: { equals: 'active' } }, { compareAtPrice: { greater_than: 0 } }],
    },
    limit: 100,
    sort: '-createdAt',
  })

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">Ofertas</h1>
      <p className="mb-6 text-neutral-500 dark:text-neutral-400">
        Productos con descuento sobre el precio de lista.
      </p>

      {products.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">No hay ofertas activas por ahora.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
