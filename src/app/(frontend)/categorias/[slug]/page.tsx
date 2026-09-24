import { notFound } from 'next/navigation'

import { ProductCard } from '@/components/ProductCard'
import { getPayloadClient } from '@/lib/payload'

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs: categories } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const category = categories[0]

  if (!category) {
    notFound()
  }

  const { docs: products } = await payload.find({
    collection: 'products',
    where: {
      and: [{ category: { equals: category.id } }, { status: { equals: 'active' } }],
    },
    limit: 24,
    sort: '-createdAt',
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {category.name}
      </h1>

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
    </div>
  )
}
