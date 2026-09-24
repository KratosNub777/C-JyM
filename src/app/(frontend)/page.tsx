import Link from 'next/link'

import { ProductCard } from '@/components/ProductCard'
import { getPayloadClient } from '@/lib/payload'

export default async function HomePage() {
  const payload = await getPayloadClient()

  const { docs: featuredProducts } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'active' } },
    limit: 8,
    sort: '-createdAt',
  })

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-lg bg-neutral-900 px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">Nuestro catálogo</h1>
        <p className="mt-2 text-neutral-300">
          Encontrá lo que buscás entre nuestros productos.
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-block rounded-md bg-white px-5 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-200"
        >
          Ver todo el catálogo
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Novedades</h2>
          <Link href="/productos" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
            Ver todos →
          </Link>
        </div>
        {featuredProducts.length === 0 ? (
          <p className="text-neutral-500">
            Todavía no hay productos cargados. Agregalos desde el{' '}
            <a href="/admin" className="underline">
              panel de administración
            </a>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
