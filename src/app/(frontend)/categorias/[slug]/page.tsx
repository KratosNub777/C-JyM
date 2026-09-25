import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { ProductCard } from '@/components/ProductCard'
import { getPayloadClient } from '@/lib/payload'

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
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
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

  const { docs: products } = await payload.find({
    collection: 'products',
    where: {
      and: [{ category: { in: categoryIds } }, { status: { equals: 'active' } }],
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
